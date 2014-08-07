package org.clangen.autom8.device.impl.json;

import org.clangen.autom8.device.Lamp;
import org.json.JSONObject;

/**
 * Created by clangen on 8/6/14.
 */
public class JsonLamp extends JsonDevice implements Lamp {
    private static final String BRIGHTNESS_ATTRIBUTE = "brightness";

    private int mBrightness;

    public JsonLamp(JSONObject json) {
        super(json);
        init();
    }

    @Override
    public int getBrightness() {
        return mBrightness;
    }

    private void init() {
        mBrightness = Integer.parseInt(getAttribute("brightness"));
    }
}
