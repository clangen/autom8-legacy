package org.clangen.autom8.device.impl.json;

import org.clangen.autom8.device.Device;

import java.util.Comparator;

/**
 * Created by clangen on 8/6/14.
 */
public class DisplayPriorityComparator implements Comparator<Device> {
    @Override
    public int compare(Device d1, Device d2) {
        int d1dp = d1.getDisplayPriority();
        int d2dp = d2.getDisplayPriority();

        String key1 = String.format("%04d-%s", d1dp, d1.getLabel());
        String key2 = String.format("%04d-%s", d2dp, d2.getLabel());

        return key2.compareTo(key1);
    }
}
