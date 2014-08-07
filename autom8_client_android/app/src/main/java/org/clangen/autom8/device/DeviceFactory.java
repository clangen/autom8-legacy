package org.clangen.autom8.device;

import org.clangen.autom8.device.impl.JsonDevice;
import org.clangen.autom8.device.impl.JsonLamp;
import org.clangen.autom8.device.impl.JsonSecuritySensor;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by clangen on 8/6/14.
 */
public class DeviceFactory {
    public static Device fromJson(JSONObject json) throws JSONException {
        int type = json.getInt(JsonDevice.TYPE_NODE);

        switch (type) {
            case DeviceType.APPLIANCE:
            case DeviceType.UNKNOWN:
                return new JsonDevice(json);

            case DeviceType.LAMP:
                return new JsonLamp(json);

            case DeviceType.SECURITY_SENSOR:
                return new JsonSecuritySensor(json);
        }

        return null;
    }
}
