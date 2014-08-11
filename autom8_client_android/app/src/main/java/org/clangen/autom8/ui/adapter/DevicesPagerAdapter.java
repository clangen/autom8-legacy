package org.clangen.autom8.ui.adapter;

import android.app.Activity;
import android.app.Fragment;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.support.v13.app.FragmentPagerAdapter;
import android.view.ViewGroup;

import org.clangen.autom8.device.DeviceLibrary;
import org.clangen.autom8.device.DeviceLibraryFactory;
import org.clangen.autom8.ui.activity.AdapterType;
import org.clangen.autom8.ui.fragment.DeviceModelFragment;
import org.clangen.autom8.util.ActivityUtil;

import java.util.HashMap;

/**
 * Created by avatar on 8/10/2014.
 */
public class DevicesPagerAdapter extends FragmentPagerAdapter {
    private static final AdapterType[] PAGE_ORDER_FLAT_AND_GROUPED =
        new AdapterType[] { AdapterType.Flat, AdapterType.Grouped };

    private static final AdapterType[] PAGE_ORDER_FLAT_ONLY =
        new AdapterType[] { AdapterType.Flat };

    private static final IntentFilter INTENT_FILTER = new IntentFilter();

    private Context mContext;
    private HashMap<Integer, DeviceModelFragment> mItems;
    private DeviceLibrary mDeviceLibrary;
    private AdapterType[] mPages;

    static {
        INTENT_FILTER.addAction(DeviceLibrary.ACTION_DEVICE_LIBRARY_REFRESHED);
    }

    public DevicesPagerAdapter(Activity context) {
        super(context.getFragmentManager());
        this.mContext = context;
        mItems = new HashMap<Integer, DeviceModelFragment>();
        mDeviceLibrary = DeviceLibraryFactory.getInstance(context.getApplicationContext());
        updatePageOrder();
        ActivityUtil.registerReceiver(context, mLibraryRefreshedReceiver, INTENT_FILTER);
    }

    public void onDestroy() {
        ActivityUtil.unregisterReceiver(mContext, mLibraryRefreshedReceiver);
    }

    @Override
    public int getCount() {
        return mPages.length;
    }

    @Override
    public Fragment getItem(int position) {
        DeviceModelFragment fragment = new DeviceModelFragment(mPages[position]);
        mItems.put(position, fragment);
        return fragment;
    }

    @Override
    public CharSequence getPageTitle(int position) {
        return mContext.getString(mPages[position].getStringId());
    }

    @Override
    public Object instantiateItem(ViewGroup container, int position) {
        DeviceModelFragment fragment =
            (DeviceModelFragment) super.instantiateItem(container, position);

        mItems.put(position, fragment);

        return fragment;
    }

    private void updatePageOrder() {
        AdapterType[] pages = PAGE_ORDER_FLAT_AND_GROUPED;
        if (ActivityUtil.isLandscape(mContext) || mDeviceLibrary.getDeviceGroups().size() == 0) {
            pages = PAGE_ORDER_FLAT_ONLY;
        }

        if (pages != mPages) {
            mPages = pages;
            this.notifyDataSetChanged();
        }
    }

    private BroadcastReceiver mLibraryRefreshedReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            updatePageOrder();
        }
    };
}
