package com.eflow.device.entity;

import com.eflow.bike.entity.Bike;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "device")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "device_id", nullable = false, unique = true)
    private String deviceId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bike_id", unique = true)
    private Bike bike;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Transport transport = Transport.SIMULATOR;

    private String address;

    @Column(nullable = false)
    private boolean online = false;

    @Column(name = "last_seen")
    private Instant lastSeen;

    @Column(nullable = false)
    private String secret;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum Transport {
        SIMULATOR,
        HTTP,
        MQTT
    }

    public Device() {}

    public Device(String deviceId, Bike bike, Transport transport, String address, String secret) {
        this.deviceId = deviceId;
        this.bike = bike;
        this.transport = transport;
        this.address = address;
        this.secret = secret;
        this.online = true;
        this.lastSeen = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Bike getBike() {
        return bike;
    }

    public void setBike(Bike bike) {
        this.bike = bike;
    }

    public Transport getTransport() {
        return transport;
    }

    public void setTransport(Transport transport) {
        this.transport = transport;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public Instant getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(Instant lastSeen) {
        this.lastSeen = lastSeen;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
