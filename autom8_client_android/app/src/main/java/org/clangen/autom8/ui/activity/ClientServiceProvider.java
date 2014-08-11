package org.clangen.autom8.ui.activity;

import org.clangen.autom8.service.IClientService;

/**
 * Created by clangen on 8/10/14.
 */
public interface ClientServiceProvider {
    IClientService getClientService();
}
