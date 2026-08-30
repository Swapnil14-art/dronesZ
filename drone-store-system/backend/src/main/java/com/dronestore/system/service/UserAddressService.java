package com.dronestore.system.service;

import com.dronestore.system.dto.UserAddressDto;
import com.dronestore.system.dto.UserAddressRequest;
import com.dronestore.system.entity.User;
import com.dronestore.system.entity.UserAddress;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.UserAddressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAddressService {

    private final UserAddressRepository addressRepository;
    private final UserService userService;

    public UserAddressService(UserAddressRepository addressRepository, UserService userService) {
        this.addressRepository = addressRepository;
        this.userService = userService;
    }

    public List<UserAddressDto> getUserAddresses(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserAddressDto addAddress(String userEmail, UserAddressRequest request) {
        User user = userService.getUserByEmail(userEmail);
        List<UserAddress> existing = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());

        boolean makeDefault = existing.isEmpty() || Boolean.TRUE.equals(request.getIsDefault());

        if (makeDefault) {
            existing.forEach(a -> {
                if (Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            });
        }

        UserAddress address = new UserAddress();
        address.setUser(user);
        address.setFullName(request.getFullName().trim());
        address.setPhone(request.getPhone().trim());
        address.setAddressLine1(request.getAddressLine1().trim());
        address.setAddressLine2(request.getAddressLine2() != null ? request.getAddressLine2().trim() : null);
        address.setCity(request.getCity().trim());
        address.setState(request.getState().trim());
        address.setPostalCode(request.getPostalCode().trim());
        address.setCountry(request.getCountry() != null ? request.getCountry().trim() : "India");
        address.setIsDefault(makeDefault);

        UserAddress saved = addressRepository.save(address);
        return mapToDto(saved);
    }

    @Transactional
    public UserAddressDto updateAddress(String userEmail, Long addressId, UserAddressRequest request) {
        User user = userService.getUserByEmail(userEmail);
        UserAddress address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with ID: " + addressId));

        if (Boolean.TRUE.equals(request.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            List<UserAddress> existing = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());
            existing.forEach(a -> {
                if (Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            });
            address.setIsDefault(true);
        }

        address.setFullName(request.getFullName().trim());
        address.setPhone(request.getPhone().trim());
        address.setAddressLine1(request.getAddressLine1().trim());
        address.setAddressLine2(request.getAddressLine2() != null ? request.getAddressLine2().trim() : null);
        address.setCity(request.getCity().trim());
        address.setState(request.getState().trim());
        address.setPostalCode(request.getPostalCode().trim());
        address.setCountry(request.getCountry() != null ? request.getCountry().trim() : "India");

        UserAddress updated = addressRepository.save(address);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteAddress(String userEmail, Long addressId) {
        User user = userService.getUserByEmail(userEmail);
        UserAddress address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with ID: " + addressId));

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);

        if (wasDefault) {
            List<UserAddress> remaining = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());
            if (!remaining.isEmpty()) {
                UserAddress newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }

    @Transactional
    public UserAddressDto setDefaultAddress(String userEmail, Long addressId) {
        User user = userService.getUserByEmail(userEmail);
        UserAddress target = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with ID: " + addressId));

        List<UserAddress> existing = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId());
        existing.forEach(a -> {
            boolean isTarget = a.getId().equals(addressId);
            if (!a.getIsDefault().equals(isTarget)) {
                a.setIsDefault(isTarget);
                addressRepository.save(a);
            }
        });

        target.setIsDefault(true);
        return mapToDto(target);
    }

    public UserAddressDto mapToDto(UserAddress address) {
        return new UserAddressDto(
                address.getId(),
                address.getFullName(),
                address.getPhone(),
                address.getAddressLine1(),
                address.getAddressLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry(),
                address.getIsDefault()
        );
    }
}
