CREATE DATABASE IF NOT EXISTS aqi_event;
USE aqi_event;

CREATE TABLE IF NOT EXISTS stations (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    station_name VARCHAR(255),
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6)
);

CREATE TABLE IF NOT EXISTS aqi_readings (
    reading_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    last_update DATETIME NOT NULL,
    FOREIGN KEY (station_id) REFERENCES stations(station_id)
);

CREATE TABLE IF NOT EXISTS pollutant_readings (
    reading_id INT NOT NULL,
    pollutant_id VARCHAR(20) NOT NULL,
    pollutant_min DECIMAL(10,2),
    pollutant_avg DECIMAL(10,2),
    pollutant_max DECIMAL(10,2),
    PRIMARY KEY (reading_id, pollutant_id),
    FOREIGN KEY (reading_id) REFERENCES aqi_readings(reading_id)
);

CREATE TABLE IF NOT EXISTS pollution_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    reading_id INT NOT NULL,
    pollutant_id VARCHAR(20),
    event_type VARCHAR(50),
    previous_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    change_value DECIMAL(10,2),
    change_percentage DECIMAL(10,2),
    severity VARCHAR(10),
    message VARCHAR(255),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(station_id),
    FOREIGN KEY (reading_id) REFERENCES aqi_readings(reading_id)
);

CREATE TABLE IF NOT EXISTS alert_subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    station_id INT NOT NULL,
    min_severity ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_email_station (email, station_id),
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alert_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    event_id INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_sub_event (subscription_id, event_id),
    FOREIGN KEY (subscription_id) REFERENCES alert_subscriptions(subscription_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES pollution_events(event_id) ON DELETE CASCADE
);