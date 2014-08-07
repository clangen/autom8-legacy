package org.clangen.autom8.device.impl.db;

import java.util.HashMap;

import org.clangen.autom8.device.SecuritySensor;

public class DbSecuritySensor extends DbDevice implements SecuritySensor {
    private static final String ARMED_ATTRIBUTE = "armed";
    private static final String TRIPPED_ATTRIBUTE = "tripped";

    boolean mArmed = false, mTripped = false;

	public DbSecuritySensor() {
	}

    public boolean isArmed() {
        return mArmed;
    }

    public boolean isTripped() {
        return mTripped;
    }

    protected void loadExtendedAttributes(HashMap<String, String> attributes) {
        mArmed = "true".equals(attributes.get(ARMED_ATTRIBUTE));
        mTripped = "true".equals(attributes.get(TRIPPED_ATTRIBUTE));
    }
}
