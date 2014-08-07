package org.clangen.autom8.db;

import android.content.Context;

/**
 * Created by clangen on 8/6/14.
 */
public class DeviceLibraryFactory {
    private static DeviceLibrary mInstance;

    public static synchronized DeviceLibrary getInstance(Context context) {
        if (mInstance == null) {
            mInstance = new InMemoryDeviceLibrary(context);
        }

        return mInstance;
    }
}
