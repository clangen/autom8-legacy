#include "device_base.hpp"
#include <boost/format.hpp> 

#include <json/value.h>
#include <json/writer.h>

using namespace autom8;

json_value_ref device_base::to_json() {
	json_value_ref result(new Json::Value(Json::objectValue));

	(*result)["address"] = Json::Value(this->address());
	(*result)["type"] = Json::Value(this->type());
	(*result)["label"] = Json::Value(this->label());
	(*result)["status"] = Json::Value(this->status());

	(*result)["attributes"] = Json::Value(Json::objectValue);
	this->get_extended_json_attributes((*result)["attributes"]);

	return result;
}

void device_base::get_extended_json_attributes(json_value& target) {
}

void device_base::on_status_changed() {
    status_changed(shared_from_this());
}