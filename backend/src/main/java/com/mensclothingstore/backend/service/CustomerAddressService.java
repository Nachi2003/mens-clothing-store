package com.mensclothingstore.backend.service;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.CustomerAddressRequest;
import com.mensclothingstore.backend.dto.CustomerAddressResponse;
import com.mensclothingstore.backend.entity.CustomerAddress;
import com.mensclothingstore.backend.entity.User;
import com.mensclothingstore.backend.repository.CustomerAddressRepository;
import com.mensclothingstore.backend.repository.UserRepository;

@Service
public class CustomerAddressService {

    private final CustomerAddressRepository customerAddressRepository;
    private final UserRepository userRepository;

    public CustomerAddressService(
            CustomerAddressRepository customerAddressRepository,
            UserRepository userRepository) {

        this.customerAddressRepository = customerAddressRepository;
        this.userRepository = userRepository;
    }

    public CustomerAddressResponse createAddress(
            Long userId,
            CustomerAddressRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if (customerAddressRepository.existsByUser_UserId(userId)) {
            throw new RuntimeException(
                    "Address already exists for this customer");
        }

        CustomerAddress customerAddress = new CustomerAddress();

        customerAddress.setUser(user);
        customerAddress.setAddress(request.getAddress());
        customerAddress.setCity(request.getCity());
        customerAddress.setState(request.getState());
        customerAddress.setPincode(request.getPincode());
        customerAddress.setIsDefault(true);

        CustomerAddress savedAddress =
                customerAddressRepository.save(customerAddress);

        return convertToResponse(savedAddress);
    }

    public CustomerAddressResponse getAddress(Long userId) {

        CustomerAddress address =
                customerAddressRepository.findByUser_UserId(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Address not found for this customer"));

        return convertToResponse(address);
    }

    public CustomerAddressResponse updateAddress(
            Long userId,
            CustomerAddressRequest request) {

        CustomerAddress address =
                customerAddressRepository.findByUser_UserId(userId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Address not found for this customer"));

        address.setAddress(request.getAddress());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());

        CustomerAddress updatedAddress =
                customerAddressRepository.save(address);

        return convertToResponse(updatedAddress);
    }

    private CustomerAddressResponse convertToResponse(
            CustomerAddress address) {

        return new CustomerAddressResponse(
                address.getAddressId(),
                address.getUser().getUserId(),
                address.getAddress(),
                address.getCity(),
                address.getState(),
                address.getPincode(),
                address.getIsDefault(),
                address.getCreatedAt()
        );
    }
}