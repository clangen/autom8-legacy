package org.clangen.autom8.util;

import android.support.v4.view.ViewCompat;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.TypedValue;

import org.clangen.autom8.R;

/**
 * Created by casey on 2/6/2016.
 */
public class ToolbarUtil {
    private static int primaryColor = -1;

    public static Toolbar initTranslucent(final AppCompatActivity activity) {
        return init(activity);
    }

    public static Toolbar initSolid(final AppCompatActivity activity) {
        final Toolbar tb = init(activity);
        tb.setBackgroundColor(getPrimaryColor(activity));
        return tb;
    }

    private static Toolbar init(final AppCompatActivity activity) {
        final Toolbar tb = (Toolbar) activity.findViewById(R.id.toolbar);
        activity.setSupportActionBar(tb);
        ViewCompat.setElevation(tb, 5.0f);
        return tb;
    }

    private static int getPrimaryColor(final AppCompatActivity activity) {
        if (primaryColor == -1) {
            final TypedValue tv = new TypedValue();
            activity.getTheme().resolveAttribute(R.attr.colorPrimary, tv, true);
            primaryColor = tv.data;
        }

        return primaryColor;
    }
}
