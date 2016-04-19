package org.clangen.autom8.ui.activity;

import android.os.Build;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.view.ViewTreeObserver;

public class ActivityBase extends AppCompatActivity {
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final View content = findViewById(android.R.id.content);

        content.getViewTreeObserver().addOnGlobalLayoutListener(
            new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    if (android.os.Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN) {
                        content.getViewTreeObserver().removeGlobalOnLayoutListener(this);
                    }
                    else {
                        content.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                    }

                    onContentViewVisible();
                }
            });
    }

    protected void onContentViewVisible() {

    }
}
