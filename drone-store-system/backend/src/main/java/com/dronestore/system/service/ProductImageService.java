package com.dronestore.system.service;

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
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

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

            // Update product image endpoint URL reference on Product entity
            String imageUrl = "/api/products/" + productId + "/image";
            product.setImage(imageUrl);
            productRepository.save(product);

            Optional<ProductImage> existingOpt = productImageRepository.findByProductIdAndIsPrimaryTrue(productId);

            if (existingOpt.isPresent()) {
                ProductImage existing = existingOpt.get();

                // Prevent storing duplicate image bytes if content is unchanged
                if (hash.equals(existing.getContentHash())) {
                    return existing;
                }

                // Overwrite existing record in-place to update old BYTEA data
                existing.setImageData(processedBytes);
                existing.setMimeType(mimeType);
                existing.setFileName(file.getOriginalFilename());
                existing.setFileSize((long) processedBytes.length);
                existing.setContentHash(hash);
                existing.setIsPrimary(true);

                return productImageRepository.save(existing);
            } else {
                // Create single primary image record
                ProductImage newImage = new ProductImage();
                newImage.setProduct(product);
                newImage.setImageData(processedBytes);
                newImage.setMimeType(mimeType);
                newImage.setFileName(file.getOriginalFilename());
                newImage.setFileSize((long) processedBytes.length);
                newImage.setContentHash(hash);
                newImage.setIsPrimary(true);

                return productImageRepository.save(newImage);
            }
        } catch (IOException e) {
            throw new BadRequestException("Failed to process image upload: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public ProductImage getPrimaryImageByProductId(Long productId) {
        return productImageRepository.findByProductIdAndIsPrimaryTrue(productId)
                .orElseGet(() -> productImageRepository.findFirstByProductId(productId)
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

    @Transactional
    public void deleteProductImage(Long productId) {
        ProductImage image = getPrimaryImageByProductId(productId);
        productImageRepository.delete(image);

        // Clear image URL reference on Product entity if present
        productRepository.findById(productId).ifPresent(p -> {
            p.setImage(null);
            productRepository.save(p);
        });
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
                return rawBytes; // Return original if non-standard or unparseable by ImageIO
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
            return rawBytes; // Fallback to raw bytes if resize fails
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
