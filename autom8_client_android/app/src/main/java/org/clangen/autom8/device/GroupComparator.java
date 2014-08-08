package org.clangen.autom8.device;

import java.util.Comparator;

/**
 * Created by clangen on 8/7/14.
 */
public class GroupComparator implements Comparator<Group> {
    @Override
    public int compare(Group g1, Group g2) {
        return g1.getName().compareTo(g2.getName());
    }
}
