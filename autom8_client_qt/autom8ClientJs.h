#ifndef AUTOM8_CLIENT_JS_QT_H
#define AUTOM8_CLIENT_JS_QT_H

#include <qobject.h>
#include <client.hpp>

class autom8ClientJs : public QObject, public autom8::signal_handler {
	Q_OBJECT
		
public:
	autom8ClientJs(QObject * parent = 0);
	~autom8ClientJs();

	Q_INVOKABLE void connect(QString host, QString port, QString password);
	Q_INVOKABLE void send(QString uri, QString body);
	Q_INVOKABLE bool isConnected();

private:
	void connectedProxy();
	void disconnectedProxy(autom8::client::reason reason);
	void requestReceivedProxy(autom8::request_ptr);
	void responseReceivedProxy(autom8::response_ptr);

signals:
	void connected();
	void disconnected(int reason);
	void requestReceived(QString uri, QString body);
	void responseReceived(QString uri, QString body);

private:
	autom8::client_ptr mClient;
	QString mHost, mPort, mPwHash;
};

#endif