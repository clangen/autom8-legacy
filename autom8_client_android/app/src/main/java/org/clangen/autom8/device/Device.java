package org.clangen.autom8.device;

public interface Device {
    int getType();
    int getStatus();
    String getAddress();
    String getLabel();
    String getAttribute(String key);
}
