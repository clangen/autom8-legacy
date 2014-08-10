package org.clangen.autom8.ui.adapter;

import android.app.Activity;
import android.app.Fragment;
import android.content.Context;
import android.support.v13.app.FragmentPagerAdapter;
import android.view.ViewGroup;

import org.clangen.autom8.service.IClientService;
import org.clangen.autom8.ui.activity.AdapterType;
import org.clangen.autom8.ui.fragment.DeviceModelFragment;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * Created by avatar on 8/10/2014.
 */
public class DevicesPagerAdapter extends FragmentPagerAdapter {
    private static AdapterType[] PAGE_ORDER =
        new AdapterType[] { AdapterType.Flat, AdapterType.Grouped };

    private IClientService mClientService;
    private Context mContext;
    private HashMap<Integer, DeviceModelFragment> mItems;

    public DevicesPagerAdapter(Activity context) {
        super(context.getFragmentManager());
        mItems = new HashMap<Integer, DeviceModelFragment>();
        this.mContext = context;
    }

    public void setClientService(IClientService service) {
        mClientService = service;

        for (Integer i : mItems.keySet()) {
            mItems.get(i).setClientService(service);
        }
    }

    @Override
    public int getCount() {
        return PAGE_ORDER.length;
    }

    @Override
    public Fragment getItem(int position) {
        return new DeviceModelFragment(PAGE_ORDER[position]);
    }

    @Override
    public CharSequence getPageTitle(int position) {
        return mContext.getString(PAGE_ORDER[position].getStringId());
    }

    @Override
    public Object instantiateItem(ViewGroup container, int position) {
        DeviceModelFragment fragment =
            (DeviceModelFragment) super.instantiateItem(container, position);

        mItems.put(position, fragment);
        fragment.setClientService(mClientService);

        return fragment;
    }
}
