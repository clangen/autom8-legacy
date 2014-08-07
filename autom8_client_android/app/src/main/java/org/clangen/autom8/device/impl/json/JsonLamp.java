package org.clangen.autom8.device.impl.json;

import org.clangen.autom8.device.Lamp;
import org.json.JSONObject;

/**
 * Created by clangen on 8/6/14.
 */
public class JsonLamp extends JsonDevice implements Lamp {
    public JsonLamp(JSONObject json) {
        super(json);
    }

    @Override
    public int getBrightness() {
        return 0;
    }
}
