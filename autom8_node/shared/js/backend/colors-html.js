require ("colors");

String.prototype.toHtml = (function() {
    var table = {
        "\u001b\\[49;5;8m": "<span style=\"background-color:gray;\">",
        "\u001b\\[22m":     "</b>",
        "\u001b\\[23m":     "</i>",
        "\u001b\\[24m":     "</u>",
        "\u001b\\[27m":     "</span>",
        "\u001b\\[29m":     "</del>",
        "\u001b\\[30m":     "<span style=\"color:black;\">",
        "\u001b\\[37m":     "<span style=\"color:white;\">",
        "\u001b\\[39m":     "</span>",
        "\u001b\\[34m":     "<span style=\"color:blue;\">",
        "\u001b\\[36m":     "<span style=\"color:cyan;\">",
        "\u001b\\[32m":     "<span style=\"color:green;\">",
        "\u001b\\[35m":     "<span style=\"color:magenta;\">",
        "\u001b\\[31m":     "<span style=\"color:red;\">",
        "\u001b\\[33m":     "<span style=\"color:yellow;\">",
        "\u001b\\[40m":     "<span style=\"background-color:black;\">",
        "\u001b\\[41m":     "<span style=\"background-color:red;\">",
        "\u001b\\[42m":     "<span style=\"background-color:green;\">",
        "\u001b\\[43m":     "<span style=\"background-color:yellow;\">",
        "\u001b\\[44m":     "<span style=\"background-color:blue;\">",
        "\u001b\\[45m":     "<span style=\"background-color:magenta;\">",
        "\u001b\\[46m":     "<span style=\"background-color:cyan;\">",
        "\u001b\\[47m":     "<span style=\"background-color:white;\">",
        "\u001b\\[49m":     "</span>",
        "\u001b\\[90m":     "<span style=\"color:gray;\">",
        "\u001b\\[1m":      "<b>",
        "\u001b\\[3m":      "<i>",
        "\u001b\\[4m":      "<u>",
        "\u001b\\[7m":      "<span style=\"background-color:black;color:white;\">",
        "\u001b\\[9m":      "<del>",

    };

    return function() {
        var regex;
        var result = this;
        for (var k in table) {
            if (table.hasOwnProperty(k)) {
                result = result.replace(new RegExp(k, "g"), table[k]);
            }
        }
        return '<span class="log-entry">' + result + '</span>';
    };
}());