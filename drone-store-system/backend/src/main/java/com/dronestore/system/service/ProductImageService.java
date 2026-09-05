package com.dronestore.system.service;

import com.dronestore.system.dto.ProductImageDto;
import com.dronestore.system.entity.Product;
import com.dronestore.system.entity.ProductImage;
import com.dronestore.system.exception.BadRequestException;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.ProductImageRepository;
import com.dronestore.system.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductImageService {

    public static final long MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    public static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final int MAX_DIMENSION = 1600; // Max width or height in pixels (1600x1600)

    private final ProductImageRepository productImageRepository;
    private final ProductRepository productRepository;

    public ProductImageService(ProductImageRepository productImageRepository, ProductRepository productRepository) {
        this.productImageRepository = productImageRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductImageDto> getProductImages(Long productId) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        return images.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public List<ProductImageDto> uploadMultipleProductImages(Long productId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No image files provided for upload.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + productId + " not found"));

        boolean hasExistingPrimary = productImageRepository.findByProductIdAndIsPrimaryTrue(productId).isPresent();
        int currentMaxOrder = productImageRepository.findTopByProductIdOrderByDisplayOrderDesc(productId)
                .map(i -> i.getDisplayOrder() + 1)
                .orElse(0);

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            validateFile(file);

            try {
                byte[] originalBytes = file.getBytes();
                String mimeType = file.getContentType() != null ? file.getContentType().toLowerCase() : "image/jpeg";
                byte[] processedBytes = compressAndResizeImage(originalBytes, mimeType);

                if (processedBytes.length > MAX_IMAGE_SIZE_BYTES) {
                    throw new BadRequestException("Optimized image file size exceeds maximum limit of 10 MB.");
                }

                String hash = calculateSHA256(processedBytes);

                ProductImage newImage = new ProductImage();
                newImage.setProduct(product);
                newImage.setImageData(processedBytes);
                newImage.setMimeType(mimeType);
                newImage.setFileName(file.getOriginalFilename());
                newImage.setFileSize((long) processedBytes.length);
                newImage.setContentHash(hash);
                newImage.setDisplayOrder(currentMaxOrder + i);

                // Set as primary if no primary existed and this is the first file in the batch
                if (!hasExistingPrimary && i == 0) {
                    newImage.setIsPrimary(true);
                    hasExistingPrimary = true;
                } else {
                    newImage.setIsPrimary(false);
                }

                productImageRepository.save(newImage);
            } catch (IOException e) {
                throw new BadRequestException("Failed to process image upload: " + e.getMessage());
            }
        }

        // Update product primary image reference
        updateProductImageReference(product);

        return getProductImages(productId);
    }

    @Transactional
    public ProductImage uploadOrReplaceProductImage(Long productId, MultipartFile file) {
        validateFile(file);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + productId + " not found"));

        try {
            byte[] originalBytes = file.getBytes();
            String mimeType = file.getContentType() != null ? file.getContentType().toLowerCase() : "image/jpeg";
            byte[] processedBytes = compressAndResizeImage(originalBytes, mimeType);

            if (processedBytes.length > MAX_IMAGE_SIZE_BYTES) {
                throw new BadRequestException("Optimized image file size exceeds maximum limit of 10 MB.");
            }

            String hash = calculateSHA256(processedBytes);

            Optional<ProductImage> existingOpt = productImageRepository.findByProductIdAndIsPrimaryTrue(productId);

            if (existingOpt.isPresent()) {
                ProductImage existing = existingOpt.get();

                if (hash.equals(existing.getContentHash())) {
                    return existing;
                }

                existing.setImageData(processedBytes);
                existing.setMimeType(mimeType);
                existing.setFileName(file.getOriginalFilename());
                existing.setFileSize((long) processedBytes.length);
                existing.setContentHash(hash);
                existing.setIsPrimary(true);

                ProductImage saved = productImageRepository.save(existing);
                updateProductImageReference(product);
                return saved;
            } else {
                int nextOrder = productImageRepository.findTopByProductIdOrderByDisplayOrderDesc(productId)
                        .map(i -> i.getDisplayOrder() + 1)
                        .orElse(0);

                ProductImage newImage = new ProductImage();
                newImage.setProduct(product);
                newImage.setImageData(processedBytes);
                newImage.setMimeType(mimeType);
                newImage.setFileName(file.getOriginalFilename());
                newImage.setFileSize((long) processedBytes.length);
                newImage.setContentHash(hash);
                newImage.setIsPrimary(true);
                newImage.setDisplayOrder(nextOrder);

                ProductImage saved = productImageRepository.save(newImage);
                updateProductImageReference(product);
                return saved;
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to process image upload: " + e.getMessage());
        }
    }

    @Transactional
    public ProductImageDto setPrimaryImage(Long productId, Long imageId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + productId + " not found"));

        ProductImage targetImage = productImageRepository.findByProductIdAndId(productId, imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image with ID " + imageId + " not found for product ID " + productId));

        List<ProductImage> allImages = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        for (ProductImage img : allImages) {
            if (!img.getId().equals(imageId) && Boolean.TRUE.equals(img.getIsPrimary())) {
                img.setIsPrimary(false);
                productImageRepository.saveAndFlush(img);
            }
        }

        targetImage.setIsPrimary(true);
        ProductImage savedTarget = productImageRepository.saveAndFlush(targetImage);

        updateProductImageReference(product);
        return mapToDto(savedTarget);
    }

    @Transactional
    public List<ProductImageDto> reorderImages(Long productId, List<Long> imageIds) {
        if (imageIds == null || imageIds.isEmpty()) {
            return getProductImages(productId);
        }

        List<ProductImage> allImages = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        Map<Long, ProductImage> imageMap = allImages.stream().collect(Collectors.toMap(ProductImage::getId, img -> img));

        int order = 0;
        for (Long id : imageIds) {
            ProductImage img = imageMap.get(id);
            if (img != null) {
                img.setDisplayOrder(order++);
                imageMap.remove(id);
            }
        }

        // Remaining images not mentioned in imageIds list maintain order after
        for (ProductImage img : imageMap.values()) {
            img.setDisplayOrder(order++);
        }

        productImageRepository.saveAll(allImages);
        return getProductImages(productId);
    }

    @Transactional
    public ProductImageDto replaceImage(Long productId, Long imageId, MultipartFile file) {
        validateFile(file);

        ProductImage targetImage = productImageRepository.findByProductIdAndId(productId, imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image with ID " + imageId + " not found for product ID " + productId));

        try {
            byte[] originalBytes = file.getBytes();
            String mimeType = file.getContentType() != null ? file.getContentType().toLowerCase() : "image/jpeg";
            byte[] processedBytes = compressAndResizeImage(originalBytes, mimeType);

            if (processedBytes.length > MAX_IMAGE_SIZE_BYTES) {
                throw new BadRequestException("Optimized image file size exceeds maximum limit of 10 MB.");
            }

            String hash = calculateSHA256(processedBytes);

            // Overwrite in-place to ensure no duplicate or stale BYTEA remains
            targetImage.setImageData(processedBytes);
            targetImage.setMimeType(mimeType);
            targetImage.setFileName(file.getOriginalFilename());
            targetImage.setFileSize((long) processedBytes.length);
            targetImage.setContentHash(hash);

            ProductImage saved = productImageRepository.save(targetImage);

            productRepository.findById(productId).ifPresent(this::updateProductImageReference);

            return mapToDto(saved);
        } catch (IOException e) {
            throw new BadRequestException("Failed to process replacement image: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteImage(Long productId, Long imageId) {
        ProductImage targetImage = productImageRepository.findByProductIdAndId(productId, imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image with ID " + imageId + " not found for product ID " + productId));

        boolean wasPrimary = Boolean.TRUE.equals(targetImage.getIsPrimary());
        productImageRepository.delete(targetImage);
        productImageRepository.flush();

        Product product = productRepository.findById(productId).orElse(null);
        if (product != null) {
            if (wasPrimary) {
                // Promote the first remaining image (by display order) to primary
                Optional<ProductImage> nextPrimary = productImageRepository.findFirstByProductIdOrderByDisplayOrderAsc(productId);
                if (nextPrimary.isPresent()) {
                    ProductImage promoted = nextPrimary.get();
                    promoted.setIsPrimary(true);
                    productImageRepository.save(promoted);
                    updateProductImageReference(product);
                } else {
                    product.setImage(null);
                    productRepository.save(product);
                }
            } else {
                updateProductImageReference(product);
            }
        }
    }

    @Transactional
    public void deleteProductImage(Long productId) {
        // Clear all images for product
        productImageRepository.deleteByProductId(productId);
        productRepository.findById(productId).ifPresent(p -> {
            p.setImage(null);
            productRepository.save(p);
        });
    }

    @Transactional(readOnly = true)
    public byte[] getImageDataById(Long productId, Long imageId) {
        ProductImage image = productImageRepository.findByProductIdAndId(productId, imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image with ID " + imageId + " not found for product ID " + productId));
        return image.getImageData();
    }

    @Transactional(readOnly = true)
    public String getMimeTypeById(Long productId, Long imageId) {
        ProductImage image = productImageRepository.findByProductIdAndId(productId, imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image with ID " + imageId + " not found for product ID " + productId));
        return image.getMimeType();
    }

    @Transactional(readOnly = true)
    public ProductImage getPrimaryImageByProductId(Long productId) {
        return productImageRepository.findByProductIdAndIsPrimaryTrue(productId)
                .orElseGet(() -> productImageRepository.findFirstByProductIdOrderByDisplayOrderAsc(productId)
                        .orElseThrow(() -> new ResourceNotFoundException("No image found for Product ID " + productId)));
    }

    @Transactional(readOnly = true)
    public byte[] getImageDataByProductId(Long productId) {
        List<byte[]> dataList = productImageRepository.findImageDataListByProductId(productId);
        if (dataList == null || dataList.isEmpty()) {
            throw new ResourceNotFoundException("No image binary found for Product ID " + productId);
        }
        return dataList.get(0);
    }

    @Transactional(readOnly = true)
    public String getMimeTypeByProductId(Long productId) {
        List<String> mimeList = productImageRepository.findMimeTypeListByProductId(productId);
        if (mimeList == null || mimeList.isEmpty() || mimeList.get(0) == null) {
            return "image/jpeg";
        }
        return mimeList.get(0);
    }

    public ProductImageDto mapToDto(ProductImage img) {
        ProductImageDto dto = new ProductImageDto();
        dto.setId(img.getId());
        dto.setProductId(img.getProduct() != null ? img.getProduct().getId() : null);

        long timestamp = img.getUpdatedAt() != null
                ? img.getUpdatedAt().atZone(ZoneId.systemDefault()).toEpochSecond()
                : System.currentTimeMillis();

        dto.setUrl("/api/products/" + (img.getProduct() != null ? img.getProduct().getId() : 0) + "/images/" + img.getId() + "?v=" + timestamp);
        dto.setFileName(img.getFileName());
        dto.setFileSize(img.getFileSize());
        dto.setMimeType(img.getMimeType());
        dto.setIsPrimary(Boolean.TRUE.equals(img.getIsPrimary()));
        dto.setDisplayOrder(img.getDisplayOrder() != null ? img.getDisplayOrder() : 0);
        dto.setCreatedAt(img.getCreatedAt());
        dto.setUpdatedAt(img.getUpdatedAt());
        return dto;
    }

    private void updateProductImageReference(Product product) {
        Optional<ProductImage> primary = productImageRepository.findByProductIdAndIsPrimaryTrue(product.getId());
        if (!primary.isPresent()) {
            primary = productImageRepository.findFirstByProductIdOrderByDisplayOrderAsc(product.getId());
        }

        if (primary.isPresent()) {
            product.setImage("/api/products/" + product.getId() + "/image");
        } else {
            product.setImage(null);
        }
        productRepository.save(product);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded image file cannot be empty.");
        }

        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BadRequestException("Image file size exceeds maximum limit of 10 MB. Uploaded size: " + String.format("%.2f", (double) file.getSize() / (1024 * 1024)) + " MB.");
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new BadRequestException("Unsupported file type '" + mimeType + "'. Allowed image types are JPEG, PNG, WEBP, and GIF.");
        }
    }

    private byte[] compressAndResizeImage(byte[] rawBytes, String mimeType) {
        try {
            BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(rawBytes));
            if (originalImage == null) {
                return rawBytes;
            }

            int width = originalImage.getWidth();
            int height = originalImage.getHeight();

            if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
                return rawBytes;
            }

            double scale = Math.min((double) MAX_DIMENSION / width, (double) MAX_DIMENSION / height);
            int targetWidth = (int) (width * scale);
            int targetHeight = (int) (height * scale);

            BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight,
                    originalImage.getType() == 0 ? BufferedImage.TYPE_INT_RGB : originalImage.getType());
            Graphics2D g2d = resizedImage.createGraphics();

            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            g2d.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            String formatName = mimeType.contains("png") ? "png" : "jpg";
            ImageIO.write(resizedImage, formatName, baos);
            return baos.toByteArray();
        } catch (Exception e) {
            return rawBytes;
        }
    }

    private String calculateSHA256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(Arrays.hashCode(data));
        }
    }
}
