package org.clangen.autom8.device;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;

/**
 * Created by clangen on 8/7/14.
 */
public class Group implements Iterable<Device> {
    private static final DisplayPriorityComparator PRIORITY_COMPARATOR = new DisplayPriorityComparator();

    private ArrayList<Device> mDevices;
    private String mName;

    public Group(String name, List<Device> devices) {
        mName = name;
        mDevices = new ArrayList<Device>(devices);
        Collections.sort(mDevices, PRIORITY_COMPARATOR);
    }

    public String getName() {
        return mName;
    }

    @Override
    public Iterator<Device> iterator() {
        return mDevices.iterator();
    }
}
