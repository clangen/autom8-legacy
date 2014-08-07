package org.clangen.autom8.device.impl.db;

import java.util.HashMap;

import org.clangen.autom8.device.Lamp;

import android.util.Log;

public class DbLamp extends DbDevice implements Lamp {
    private static final String BRIGHTNESS_ATTRIBUTE = "brightness";
    private int mBrightness = 100;

	public DbLamp() {
		super();
	}

    public int getBrightness() {
        return mBrightness;
    }

    protected void loadExtendedAttributes(HashMap<String, String> attributes) {
        super.loadExtendedAttributes(attributes);

        try {
            mBrightness = Integer.parseInt(super.getAttribute(BRIGHTNESS_ATTRIBUTE));
        }
        catch (Exception ex) {
            Log.d("Lamp", "couldn't parse brightness attribute!");
        }
    }
}