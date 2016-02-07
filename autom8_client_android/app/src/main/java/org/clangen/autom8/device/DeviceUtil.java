package org.clangen.autom8.device;

/**
 * Created by clangen on 8/8/14.
 */
public final class DeviceUtil {
    public static boolean isDeviceToggleable(Device device) {
        final int type = device.getType();
        return type == DeviceType.APPLIANCE || type == DeviceType.LAMP;
    }
}
