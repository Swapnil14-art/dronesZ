package com.dronestore.system.cache;

import com.dronestore.system.dto.CategoryDto;
import com.dronestore.system.dto.PageResponse;
import com.dronestore.system.dto.ProductContentSectionDto;
import com.dronestore.system.dto.ProductDto;
import com.dronestore.system.dto.ProductImageDto;
import com.dronestore.system.entity.ProductContentSectionType;
import com.dronestore.system.entity.ProductStatus;
import com.dronestore.system.entity.ProductType;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class CacheSerializationTest {

    private GenericJackson2JsonRedisSerializer serializer;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        serializer = new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    @Test
    @DisplayName("ProductDto with nested images and content sections should serialize and deserialize properly")
    void testProductDtoSerialization() {
        ProductDto dto = new ProductDto();
        dto.setId(101L);
        dto.setName("DronesZ Falcon Pro 4K");
        dto.setDescription("High precision autonomous drone");
        dto.setPrice(new BigDecimal("129999.00"));
        dto.setQuantity(15);
        dto.setStatus(ProductStatus.AVAILABLE);
        dto.setProductType(ProductType.STANDALONE);
        dto.setCategoryId(2L);
        dto.setCategoryName("Enterprise Drones");
        dto.setCreatedAt(LocalDateTime.of(2026, 3, 15, 10, 30, 0));
        dto.setUpdatedAt(LocalDateTime.of(2026, 3, 16, 12, 0, 0));

        ProductImageDto image = new ProductImageDto();
        image.setId(501L);
        image.setProductId(101L);
        image.setUrl("/api/products/101/images/501?v=12345");
        image.setIsPrimary(true);
        image.setDisplayOrder(0);
        dto.setImages(Collections.singletonList(image));
        dto.setPrimaryImage(image);

        ProductContentSectionDto section = new ProductContentSectionDto();
        section.setId(801L);
        section.setProductId(101L);
        section.setTitle("Specifications");
        section.setType(ProductContentSectionType.WORD);
        section.setContent("{\"flightTime\":\"45 mins\",\"camera\":\"4K HDR\"}");
        section.setDisplayOrder(0);
        section.setEnabled(true);
        dto.setContentSections(Collections.singletonList(section));

        byte[] serialized = serializer.serialize(dto);
        assertNotNull(serialized);
        assertTrue(serialized.length > 0);

        Object deserialized = serializer.deserialize(serialized);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof ProductDto);

        ProductDto result = (ProductDto) deserialized;
        assertEquals(dto.getId(), result.getId());
        assertEquals(dto.getName(), result.getName());
        assertEquals(dto.getPrice(), result.getPrice());
        assertEquals(dto.getCreatedAt(), result.getCreatedAt());
        assertEquals(1, result.getImages().size());
        assertEquals(1, result.getContentSections().size());
        assertEquals("Specifications", result.getContentSections().get(0).getTitle());
    }

    @Test
    @DisplayName("PageResponse of ProductDto should serialize and deserialize properly")
    void testPageResponseSerialization() {
        ProductDto dto = new ProductDto();
        dto.setId(102L);
        dto.setName("DronesZ Scout V2");
        dto.setPrice(new BigDecimal("49999.00"));
        dto.setQuantity(5);
        dto.setStatus(ProductStatus.AVAILABLE);
        dto.setProductType(ProductType.STANDALONE);

        PageResponse<ProductDto> page = new PageResponse<>(
                Collections.singletonList(dto),
                0,
                20,
                1L,
                1
        );

        byte[] serialized = serializer.serialize(page);
        assertNotNull(serialized);

        Object deserialized = serializer.deserialize(serialized);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof PageResponse);

        @SuppressWarnings("unchecked")
        PageResponse<ProductDto> result = (PageResponse<ProductDto>) deserialized;
        assertEquals(0, result.getPage());
        assertEquals(20, result.getSize());
        assertEquals(1L, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals("DronesZ Scout V2", result.getContent().get(0).getName());
    }

    @Test
    @DisplayName("CategoryDto should serialize and deserialize properly")
    void testCategoryDtoSerialization() {
        CategoryDto dto = new CategoryDto(
                5L,
                "Surveillance Drones",
                "Long range inspection quadcopters",
                LocalDateTime.of(2026, 1, 1, 12, 0),
                LocalDateTime.of(2026, 2, 1, 12, 0)
        );

        byte[] serialized = serializer.serialize(dto);
        assertNotNull(serialized);

        Object deserialized = serializer.deserialize(serialized);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof CategoryDto);

        CategoryDto result = (CategoryDto) deserialized;
        assertEquals(5L, result.getId());
        assertEquals("Surveillance Drones", result.getName());
        assertEquals("Long range inspection quadcopters", result.getDescription());
    }
}
