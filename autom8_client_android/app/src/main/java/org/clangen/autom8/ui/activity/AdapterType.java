package org.clangen.autom8.ui.activity;

import org.clangen.autom8.R;

/**
* Created by clangen on 8/8/14.
*/
enum AdapterType {
    Flat(0, R.string.menu_list_flat),
    Grouped(1, R.string.menu_list_grouped);

    private int mId, mString;

    AdapterType(int id, int stringId) {
        mId = id;
        mString = stringId;
    }

    public static AdapterType fromId(int id) {
        switch (id) {
            case 0: return Flat;
            case 1: return Grouped;
        }

        throw new IllegalArgumentException("id is not valid");
    }

    public int getId() {
        return mId;
    }
}
