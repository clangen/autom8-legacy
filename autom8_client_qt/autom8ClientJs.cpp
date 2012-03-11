#include "stdafx.h"
#include "autom8ClientJs.h"

autom8ClientJs::autom8ClientJs(QObject * parent)
: QObject(parent)
{

}

autom8ClientJs::~autom8ClientJs() {

}

void autom8ClientJs::connect(QString host, QString port, QString password) {
	bool connected = isConnected();
	
	if (connected && (host == mHost) && (port == mPort) && (password == mPwHash)) {
		connectedProxy();
		return; /* already connected! don't restart */
	}

	if (connected) {
		mClient->disconnect();
	}

	mHost = host;
	mPort = port;
	mPwHash = password;

	mClient = autom8::client_ptr(new autom8::client(host.toStdString(), port.toStdString()));
	mClient->connected.connect(this, &autom8ClientJs::connectedProxy);
	mClient->disconnected.connect(this, &autom8ClientJs::disconnectedProxy);
	mClient->recv_request.connect(this, &autom8ClientJs::requestReceivedProxy);
	mClient->recv_response.connect(this, &autom8ClientJs::responseReceivedProxy);
	mClient->connect(password.toStdString());
}

bool autom8ClientJs::isConnected() {
	return mClient && (mClient->state() == autom8::client::state_connected);
}

void autom8ClientJs::send(QString uri, QString body) {
 	autom8::json_reader reader;
	autom8::json_value_ref jsonBody(new autom8::json_value());
	reader.parse(body.toStdString(), (*jsonBody));

	mClient->send(autom8::request::create(uri.toStdString(), jsonBody));
}

void autom8ClientJs::connectedProxy() {
	connected();
}

void autom8ClientJs::disconnectedProxy(autom8::client::reason reason) {
	disconnected((int) reason);
}

void autom8ClientJs::requestReceivedProxy(autom8::request_ptr request) {
	requestReceived(u2q(request->uri()), u2q(request->body()->toStyledString()));
}

void autom8ClientJs::responseReceivedProxy(autom8::response_ptr response) {
	responseReceived(u2q(response->uri()), u2q(response->body()->toStyledString()));
}