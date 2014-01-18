require ("colors");

String.prototype.toHtml = (function() {
    var table = {
        "\u001b\\[49;5;8m": "<span class=\"background-color-gray\">",
        "\u001b\\[22m":     "</b>",
        "\u001b\\[23m":     "</i>",
        "\u001b\\[24m":     "</u>",
        "\u001b\\[27m":     "</span>",
        "\u001b\\[29m":     "</del>",
        "\u001b\\[30m":     "<span class=\"color-black\">",
        "\u001b\\[37m":     "<span class=\"color-white\">",
        "\u001b\\[39m":     "</span>",
        "\u001b\\[34m":     "<span class=\"color-blue\">",
        "\u001b\\[36m":     "<span class=\"color-cyan\">",
        "\u001b\\[32m":     "<span class=\"color-green\">",
        "\u001b\\[35m":     "<span class=\"color-magenta\">",
        "\u001b\\[31m":     "<span class=\"color-red\">",
        "\u001b\\[33m":     "<span class=\"color-yellow\">",
        "\u001b\\[40m":     "<span class=\"background-color-black\">",
        "\u001b\\[41m":     "<span class=\"background-color-red\">",
        "\u001b\\[42m":     "<span class=\"background-color-green\">",
        "\u001b\\[43m":     "<span class=\"background-color-yellow\">",
        "\u001b\\[44m":     "<span class=\"background-color-blue\">",
        "\u001b\\[45m":     "<span class=\"background-color-magenta\">",
        "\u001b\\[46m":     "<span class=\"background-color-cyan\">",
        "\u001b\\[47m":     "<span class=\"background-color-white\">",
        "\u001b\\[49m":     "</span>",
        "\u001b\\[90m":     "<span class=\"color-gray\">",
        "\u001b\\[1m":      "<b>",
        "\u001b\\[3m":      "<i>",
        "\u001b\\[4m":      "<u>",
        "\u001b\\[7m":      "<span class=\"background-color-black color-white\">",
        "\u001b\\[9m":      "<del>",
    };

    return function() {
        var result = this;
        for (var k in table) {
            if (table.hasOwnProperty(k)) {
                result = result.replace(new RegExp(k, "g"), table[k]);
            }
        }

        if (result.indexOf("<") !== 0) {
            result = "<span>" + result + "</span>";
        }

        return result;
    };
}());