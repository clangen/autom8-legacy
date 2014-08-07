package org.clangen.autom8.device.impl;

import org.clangen.autom8.device.SecuritySensor;
import org.json.JSONObject;

/**
 * Created by clangen on 8/6/14.
 */
public class JsonSecuritySensor extends JsonDevice implements SecuritySensor {
    public JsonSecuritySensor(JSONObject json) {
        super(json);
    }

    @Override
    public boolean isTripped() {
        return false;
    }

    @Override
    public boolean isArmed() {
        return false;
    }
}
