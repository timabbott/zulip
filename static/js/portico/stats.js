// TODO: should take a dict of arrays and do it for all keys
function partial_sums(array) {
    var count = 0;
    var cumulative = [];

    for (var i = 0; i < array.length; i += 1) {
        count += array[i];
        cumulative[i] = count;
    }
    return cumulative;
}

// Assumes date is a round number of hours
function floor_to_local_day(date) {
    var date_copy = new Date(date.getTime());
    date_copy.setHours(0);
    return date_copy;
}

// Assumes date is a round number of hours
function floor_to_local_week(date) {
    var date_copy = floor_to_local_day(date);
    date_copy.setHours(-24 * date.getDay());
    return date_copy;
}

function messages_sent_over_time_traces(dates, values, type, date_formatter) {
    var text = dates.map(function (date) {
        return date_formatter(date);
    });
    var common = { x: dates, type: type, hoverinfo: 'none', text: text, visible: true};
    return {
        human: $.extend({ name: "Humans", y: values.human, marker: {color: '#1f77b4'}}, common),
        bot: $.extend({ name: "Bots", y: values.bot,  marker: {color: '#ff7f00'}}, common),
    };
}

function format_date(date, include_hour) {
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var month_str = months[date.getMonth()];
    var day = date.getDate();
    if (include_hour) {
        var hour = date.getHours();
        var hour_str;
        if (hour === 0) {
            hour_str = '12 AM';
        } else if (hour === 12) {
            hour_str = '12 PM';
        } else if (hour < 12) {
            hour_str = hour + ' AM';
        } else {
            hour_str = (hour-12) + ' PM';
        }
        return month_str + ' ' + day + ', ' + hour_str;
    }
    return month_str + ' ' + day;
}

function messages_sent_over_time_rangeselector(
    rangeselector_x, rangeselector_y, button_1_count, button_1_label,
    button_1_step, button_2_count, button_2_label, button_2_step) {
    return {
        x: rangeselector_x,
        y: rangeselector_y,
        buttons: [
            {
                count: button_1_count,
                label: button_1_label,
                step: button_1_step,
                stepmode: 'backward',
            },
            {
                count: button_2_count,
                label: button_2_label,
                step: button_2_step,
                stepmode: 'backward',
            },
            {
                step: 'all',
                label: 'All time',
            },
        ],
    };
}

function messages_sent_over_time_layout() {
    return {
        barmode: 'group',
        width: 750,
        height: 400,
        margin: {
            l: 40, r: 0, b: 40, t: 0,
        },
        xaxis: {
            fixedrange: true,
            rangeslider: {
                bordercolor: '#D8D8D8',
                borderwidth: 1,
            },
            type: 'date',
        },
        yaxis: {
            fixedrange: true,
            rangemode: 'tozero',
        },
        legend: {
            x: 0.75,
            y: 1.12,
            orientation: 'h',
        },
    };
}

function hover(id) {
    var myPlot = document.getElementById(id);
    myPlot.on('plotly_hover', function (data) {
        var date_text = data.points[0].data.text[data.points[0].pointNumber];
        $('#hover_date').text(date_text);
        $('#hover_humans').text("Humans:");
        $('#hover_humans_value').text(data.points[0].y);
        $('#hover_bots').text("Bots:");
        $('#hover_bots_value').text(data.points[1].y);

        // var human_colors = data.points[0].data.x.map(function () {
        //     return '#1f77b4';
        // });
        // var bot_colors = data.points[0].data.x.map(function () {
        //     return '#ff7f00';
        // });
        // human_colors[data.points[0].pointNumber] = '#185a88';
        // bot_colors[data.points[0].pointNumber] = '#cc6600';
        // var update_human = {marker:{color: human_colors}};
        // var update_bot = {marker:{color: bot_colors}};
        // Plotly.restyle(id, update_human, 0);
        // Plotly.restyle(id, update_bot, 1);
        // var legendBoxes = document.getElementById(id).getElementsByClassName("legendbar");
        // Plotly.d3.select(legendBoxes[0]).style("fill", "#1f77b4");
        // Plotly.d3.select(legendBoxes[1]).style("fill", "#ff7f00");
    });
    // myPlot.on('plotly_unhover', function () {
    //     var update_human = {marker:{color: '#1f77b4'}};
    //     var update_bot = {marker:{color: '#ff7f00'}};
    //     Plotly.restyle(id, update_human, 0);
    //     Plotly.restyle(id, update_bot, 1);
    // });
}

function populate_messages_sent_over_time(data) {
    if (data.end_times.length === 0) {
        // TODO: do something nicer here
        return;
    }

    var start_dates = data.end_times.map(function (timestamp) {
        // data.end_times are the ends of hour long intervals.
        return new Date(timestamp*1000 - 60*60*1000);
    });

    function aggregate_data(aggregation) {
        var start;
        var is_boundary;
        if (aggregation === 'day') {
            start = floor_to_local_day(start_dates[0]);
            is_boundary = function (date) {
                return date.getHours() === 0;
            };
        } else if (aggregation === 'week') {
            start = floor_to_local_week(start_dates[0]);
            is_boundary = function (date) {
                return date.getHours() === 0 && date.getDay() === 0;
            };
        }
        var dates = [start];
        var values = {human: [], bot: []};
        var current = {human: 0, bot: 0};
        var i_init = 0;
        if (is_boundary(start_dates[0])) {
            current = {human: data.realm.human[0], bot: data.realm.bot[0]};
            i_init = 1;
        }
        for (var i = i_init; i < start_dates.length; i += 1) {
            if (is_boundary(start_dates[i])) {
                dates.push(start_dates[i]);
                values.human.push(current.human);
                values.bot.push(current.bot);
                current = {human: 0, bot: 0};
            }
            current.human += data.realm.human[i];
            current.bot += data.realm.bot[i];
        }
        values.human.push(current.human);
        values.bot.push(current.bot);
        return {dates: dates, values: values};
    }

    // Generate traces
    var date_formatter = function (date) {
        return format_date(date, true);
    };
    var hourly_traces = messages_sent_over_time_traces(start_dates, data.realm, 'bar', date_formatter);

    var info = aggregate_data('day');
    date_formatter = function (date) {
        return format_date(date, false);
    };
    var daily_traces = messages_sent_over_time_traces(info.dates, info.values, 'bar', date_formatter);

    info = aggregate_data('week');
    date_formatter = function (date) {
        // return i18n.t("Week of __date__", {date: format_date(date, false)});
        return "Week of " + format_date(date, false);
    };
    var weekly_traces = messages_sent_over_time_traces(info.dates, info.values, 'bar', date_formatter);

    var dates = data.end_times.map(function (timestamp) {
        return new Date(timestamp*1000);
    });
    var values = {human: partial_sums(data.realm.human), bot: partial_sums(data.realm.bot)};
    date_formatter = function (date) {
        return format_date(date, true);
    };
    var cumulative_traces = messages_sent_over_time_traces(dates, values, 'scatter', date_formatter);

    // Generate plot
    var layout = messages_sent_over_time_layout();
    var default_rangeselector = messages_sent_over_time_rangeselector(
        0.68, -0.62, 10, 'Last 10 Days', 'day', 30, 'Last 30 Days', 'day');
    layout.xaxis.rangeselector = default_rangeselector;

    Plotly.newPlot('id_messages_sent_over_time',
                   [daily_traces.human, daily_traces.bot], layout, {displayModeBar: false});
    hover('id_messages_sent_over_time');

    // Click handlers for aggregation buttons
    var clicked_cumulative = false;

    function update_plot_on_aggregation_click(rangeselector, traces) {
        $('#daily_button').css('background', '#F0F0F0');
        $('#weekly_button').css('background', '#F0F0F0');
        $('#hourly_button').css('background', '#F0F0F0');
        $('#cumulative_button').css('background', '#F0F0F0');
        layout.xaxis.rangeselector = rangeselector;
        if (clicked_cumulative) {
            // Redraw plot entirely if switching from line graph to bar
            // graph, since otherwise rangeselector shows both
            Plotly.newPlot('id_messages_sent_over_time',
                           [traces.human, traces.bot], layout, {displayModeBar: false});
            hover('id_messages_sent_over_time');
        } else {
            Plotly.deleteTraces('id_messages_sent_over_time', [0,1]);
            Plotly.addTraces('id_messages_sent_over_time', [traces.human, traces.bot]);
            Plotly.relayout('id_messages_sent_over_time', layout);
        }
    }

    $('#hourly_button').click(function () {
        var rangeselector = messages_sent_over_time_rangeselector(
            0.66, -0.62, 24, 'Last 24 Hours', 'hour', 72, 'Last 72 Hours', 'hour');
        update_plot_on_aggregation_click(rangeselector, hourly_traces);
        $("g.button:contains('72')").css('font-family', 'arial !important');
        $(this).css('background', '#D8D8D8');
        clicked_cumulative = false;

    });

    $('#daily_button').click(function () {
        update_plot_on_aggregation_click(default_rangeselector, daily_traces);
        $(this).css('fill', '#D8D8D8');
        clicked_cumulative = false;
    });

    $('#weekly_button').click(function () {
        var rangeselector = messages_sent_over_time_rangeselector(
            0.656, -0.62, 2, 'Last 2 Months', 'month', 6, 'Last 6 Months', 'month');
        update_plot_on_aggregation_click(rangeselector, weekly_traces);
        $(this).css('background', '#D8D8D8');
        clicked_cumulative = false;
    });

    $('#cumulative_button').click(function () {
        clicked_cumulative = false;
        update_plot_on_aggregation_click(default_rangeselector, cumulative_traces);
        $(this).css('background', '#D8D8D8');
        clicked_cumulative = true;
    });
}

function throw_error(msg) {
    $('#id_stats_errors').show()
        .text(msg);
}

$.get({
    url: '/json/analytics/chart_data',
    data: {chart_name: 'messages_sent_over_time', min_length: '10'},
    idempotent: true,
    success: function (data) {
        populate_messages_sent_over_time(data);
    },
    error: function (xhr) {
        throw_error($.parseJSON(xhr.responseText).msg);
    },
});


function populate_number_of_users(data) {
    var end_dates = data.end_times.map(function (timestamp) {
            return new Date(timestamp*1000);
    });
    var trace_humans = {x: end_dates, y: data.realm.human, type: 'scatter',  name: "Active users",
                        hoverinfo: 'y', text: '', visible: true};
    var layout = {
        width: 750,
        height: 370,
        margin: {
            l: 40, r: 0, b: 100, t: 20,
        },
        xaxis: {
            rangeselector: {
                x: 0.808,
                y: -0.2,
                buttons: [
                    {count:30,
                        label:'Last 30 Days',
                        step: 'day',
                        stepmode:'backward'},
                    {
                        step: 'all',
                        label: 'All time',
                    },
                ],
            },
        },
        yaxis: {
            fixedrange: true,
            rangemode: 'tozero',
        },
    };
    Plotly.newPlot('id_number_of_users',
                   [trace_humans], layout, {displayModeBar: false});
}

$.get({
    url: '/json/analytics/chart_data',
    data: {chart_name: 'number_of_humans', min_length: '10'},
    idempotent: true,
    success: function (data) {
        populate_number_of_users(data);
    },
    error: function (xhr) {
        throw_error($.parseJSON(xhr.responseText).msg);
    },
});

function make_pie_trace(data, values, labels, text) {
    var trace = [{
        values: values,
        labels: labels,
        type: 'pie',
        direction: 'clockwise',
        rotation: -180,
        sort: false,
        // textposition: textposition,
        textinfo: "text",
        text: text,
        hoverinfo: "label+text",
    }];
    return trace;
}

function round_percentages(values) {
    var total = values.reduce(function (a, b) { return a + b; }, 0);
    var percents = values.map(function (x) {
        var unrounded = x/total*100;
        var rounded;
        if (unrounded > 99.4) {
            rounded = unrounded.toPrecision(3);
        } else {
            rounded = unrounded.toPrecision(2);
        }
        return rounded + '%';
    });
    return [total, percents];
}

function get_labels_and_data(names, data_subgroup, time_frame_integer) {
    var labels = [];
    var values = [];
    for (var key in data_subgroup) {
        if (data_subgroup.hasOwnProperty(key)) {
            if (data_subgroup[key].length < time_frame_integer) {
                time_frame_integer = data_subgroup[key].length;
            }
            var sum = 0;
            for (var i = 1; i < time_frame_integer; i += 1) {
                sum += data_subgroup[key][data_subgroup[key].length-i];
            }
            if (sum > 0) {
                values.push(sum);
                var label = names.hasOwnProperty(key) ? names[key] : key;
                labels.push(label);
            }
        }
    }
    labels = labels.sort(function (a, b) {
        return values[labels.indexOf(b)] - values[labels.indexOf(a)];
    });
    // Sort descending, using numeric comparison instead of the default string
    // comparison
    values = values.sort(function (a, b) {
        return b - a;
    });
    if (values.length > 6) {
        labels = labels.slice(0, 5);
        labels.push("Other");
        var sum_remaining = 0;
        for (var j=5; j<values.length; j+=1) {
            sum_remaining += values[j];
        }
        values = values.slice(0, 5);
        values.push(sum_remaining);
    }
    return [labels, values];
}

function populate_messages_sent_by_client(data) {
    var names = {
        electron_: "Electron",
        barnowl_: "BarnOwl",
        website_: "Website",
        API_: "API",
        android_: "Android",
        iOS_: "iOS",
        react_native_: "React Native",
    };
    var realm_cumulative = get_labels_and_data(names, data.realm, data.end_times.length);
    var realm_labels_cumulative = realm_cumulative[0];
    var realm_values_cumulative = realm_cumulative[1];
    var realm_percentages_cumulative = round_percentages(realm_values_cumulative);
    var realm_total_cumulative = realm_percentages_cumulative[0];
    var realm_text_cumulative = realm_percentages_cumulative[1];

    var realm_values_ten_days = get_labels_and_data(names, data.realm, 10)[1];
    var realm_percentages_ten_days = round_percentages(realm_values_ten_days);
    var realm_total_ten_days = realm_percentages_ten_days[0];
    var realm_text_ten_days = realm_percentages_ten_days[1];

    var realm_values_thirty_days = get_labels_and_data(names, data.realm, 30)[1];
    var realm_percentages_thirty_days = round_percentages(realm_values_thirty_days);
    var realm_total_thirty_days = realm_percentages_thirty_days[0];
    var realm_text_thirty_days = realm_percentages_thirty_days[1];

    var user_values_cumulative = get_labels_and_data(names, data.user, data.end_times.length)[1];
    var user_percentages_cumulative = round_percentages(user_values_cumulative);
    var user_total_cumulative = user_percentages_cumulative[0];
    var user_text_cumulative = user_percentages_cumulative[1];

    var user_values_ten_days = get_labels_and_data(names, data.user, 10)[1];
    var user_percentages_ten_days = round_percentages(user_values_ten_days);
    var user_total_ten_days = user_percentages_ten_days[0];
    var user_text_ten_days = user_percentages_ten_days[1];

    var user_values_thirty_days = get_labels_and_data(names, data.user, 30)[1];
    var user_percentages_thirty_days = round_percentages(user_values_thirty_days);
    var user_total_thirty_days = user_percentages_thirty_days[0];
    var user_text_thirty_days = user_percentages_thirty_days[1];

    var trace = make_pie_trace(data, realm_values_cumulative,
                               realm_labels_cumulative, realm_text_cumulative);
    var layout = {
        margin: {
            l: 90, r: 0, b: 0, t: 0,
        },
        width: 450,
        height: 300,
    };
    Plotly.newPlot('id_messages_sent_by_client', trace, layout, {displayModeBar: false});

    var total = document.getElementById('pie_messages_sent_by_client_total');
    total.innerHTML = "Total messages: " +
        realm_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    var time_range = 'cumulative';
    var type_data = 'realm';

    $('#messages_by_client_realm_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_client_user_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_client');
        type_data = 'realm';
        if (time_range === 'cumulative') {
            plotDiv.data[0].values = realm_values_cumulative;
            plotDiv.data[0].text = realm_text_cumulative;
            total.innerHTML = "Total messages: " +
                realm_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else if (time_range === 'ten') {
            plotDiv.data[0].values = realm_values_ten_days;
            plotDiv.data[0].text = realm_text_ten_days;
            total.innerHTML = "Total messages: " +
                realm_total_ten_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = realm_values_thirty_days;
            plotDiv.data[0].text = realm_text_thirty_days;
            total.innerHTML = "Total messages: " +
                realm_total_thirty_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_client');

    });
    $('#messages_by_client_user_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_client_realm_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_client');
        type_data = 'user';
        if (time_range === 'cumulative') {
            plotDiv.data[0].values = user_values_cumulative;
            plotDiv.data[0].text = user_text_cumulative;
            total.innerHTML = "Total messages: " +
                user_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else if (time_range === 'ten') {
            plotDiv.data[0].values = user_values_ten_days;
            plotDiv.data[0].text = user_text_ten_days;
            total.innerHTML = "Total messages: " +
                user_total_ten_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = user_values_thirty_days;
            plotDiv.data[0].text = user_text_thirty_days;
            total.innerHTML = "Total messages: " +
                user_total_thirty_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_client');

    });

    $('#messages_by_client_ten_days_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_client_thirty_days_button').css('background', '#F0F0F0');
        $('#messages_by_client_cumulative_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_client');
        time_range = 'ten';
        if (type_data === 'realm') {
            plotDiv.data[0].values = realm_values_ten_days;
            plotDiv.data[0].text = realm_text_ten_days;
            total.innerHTML = "Total messages: " +
                realm_total_ten_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = user_values_ten_days;
            plotDiv.data[0].text = user_text_ten_days;
            total.innerHTML = "Total messages: " +
                user_total_ten_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_client');
    });

    $('#messages_by_client_thirty_days_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_client_ten_days_button').css('background', '#F0F0F0');
        $('#messages_by_client_cumulative_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_client');
        time_range = 'thirty';
        if (type_data === 'realm') {
            plotDiv.data[0].values = realm_values_thirty_days;
            plotDiv.data[0].text = realm_text_thirty_days;
            total.innerHTML = "Total messages: " +
                realm_total_thirty_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = user_values_thirty_days;
            plotDiv.data[0].text = user_text_thirty_days;
            total.innerHTML = "Total messages: " +
                user_total_thirty_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_client');
    });

    $('#messages_by_client_cumulative_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_client_thirty_days_button').css('background', '#F0F0F0');
        $('#messages_by_client_ten_days_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_client');
        time_range = 'cumulative';
        if (type_data === 'realm') {
            plotDiv.data[0].values = realm_values_cumulative;
            plotDiv.data[0].text = realm_text_cumulative;
            total.innerHTML = "Total messages: " +
                realm_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = user_values_cumulative;
            plotDiv.data[0].text = user_text_cumulative;
            total.innerHTML = "Total messages: " +
                user_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_client');
    });
    // handle links with @href started with '#' only
    $(document).on('click', 'a[href^="#"]', function (e) {
        // target element id
        var id = $(this).attr('href');
        // target element
        var $id = $(id);
        if ($id.length === 0) {
            return;
        }
        // prevent standard hash navigation (avoid blinking in IE)
        e.preventDefault();
        var pos = $id.offset().top+$('.page-content')[0].scrollTop-50;
        $('.page-content').animate({scrollTop: pos + "px"}, 500);
    });
}

$.get({
    url: '/json/analytics/chart_data',
    data: {chart_name: 'messages_sent_by_client', min_length: '10'},
    idempotent: true,
    success: function (data) {
        populate_messages_sent_by_client(data);
    },
    error: function (xhr) {
        throw_error($.parseJSON(xhr.responseText).msg);
    },
});

function populate_messages_sent_by_message_type(data) {
    var names = {
        public_stream: "Public Stream",
        private_stream: "Private Stream",
        private_message: "Private Message",
    };
    var realm_cumulative = get_labels_and_data(names, data.realm, data.end_times.length);
    var realm_labels_cumulative = realm_cumulative[0];
    var realm_values_cumulative = realm_cumulative[1];
    var realm_percentages_cumulative = round_percentages(realm_values_cumulative);
    var realm_total_cumulative = realm_percentages_cumulative[0];
    var realm_text_cumulative = realm_percentages_cumulative[1];

    var realm_values_ten_days = get_labels_and_data(names, data.realm, 10)[1];
    var realm_percentages_ten_days = round_percentages(realm_values_ten_days);
    var realm_total_ten_days = realm_percentages_ten_days[0];
    var realm_text_ten_days = realm_percentages_ten_days[1];

    var realm_values_thirty_days = get_labels_and_data(names, data.realm, 30)[1];
    var realm_percentages_thirty_days = round_percentages(realm_values_thirty_days);
    var realm_total_thirty_days = realm_percentages_thirty_days[0];
    var realm_text_thirty_days = realm_percentages_thirty_days[1];

    var user_values_cumulative = get_labels_and_data(names, data.user, data.end_times.length)[1];
    var user_percentages_cumulative = round_percentages(user_values_cumulative);
    var user_total_cumulative = user_percentages_cumulative[0];
    var user_text_cumulative = user_percentages_cumulative[1];

    var user_values_ten_days = get_labels_and_data(names, data.user, 10)[1];
    var user_percentages_ten_days = round_percentages(user_values_ten_days);
    var user_total_ten_days = user_percentages_ten_days[0];
    var user_text_ten_days = user_percentages_ten_days[1];

    var user_values_thirty_days = get_labels_and_data(names, data.user, 30)[1];
    var user_percentages_thirty_days = round_percentages(user_values_thirty_days);
    var user_total_thirty_days = user_percentages_thirty_days[0];
    var user_text_thirty_days = user_percentages_thirty_days[1];

    var trace = make_pie_trace(data, realm_values_cumulative,
                               realm_labels_cumulative, realm_text_cumulative);

    var total = document.getElementById('pie_messages_sent_by_type_total');
    total.innerHTML = "Total messages: " +
        realm_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    var layout = {
        margin: {
            l: 90, r: 0, b: 0, t: 0,
        },
        width: 465,
        height: 300,
    };
    Plotly.newPlot('id_messages_sent_by_message_type', trace, layout, {displayModeBar: false});

    var time_range = 'cumulative';
    var type_data = 'realm';

    $('#messages_by_type_realm_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_type_user_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_message_type');
        type_data = 'realm';
        if (time_range === 'cumulative') {
            plotDiv.data[0].values = realm_values_cumulative;
            plotDiv.data[0].text = realm_text_cumulative;
            total.innerHTML = "Total messages: " +
                realm_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else if (time_range === 'ten') {
            plotDiv.data[0].values = realm_values_ten_days;
            plotDiv.data[0].text = realm_text_ten_days;
            total.innerHTML = "Total messages: " +
                realm_total_ten_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = realm_values_thirty_days;
            plotDiv.data[0].text = realm_text_thirty_days;
            total.innerHTML = "Total messages: " +
                realm_total_thirty_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_message_type');

    });
    $('#messages_by_type_user_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_type_realm_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_message_type');
        type_data = 'user';
        if (time_range === 'cumulative') {
            plotDiv.data[0].values = user_values_cumulative;
            plotDiv.data[0].text = user_text_cumulative;
            total.innerHTML = "Total messages: " +
                user_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else if (time_range === 'ten') {
            plotDiv.data[0].values = user_values_ten_days;
            plotDiv.data[0].text = user_text_ten_days;
            total.innerHTML = "Total messages: " +
                user_total_ten_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = user_values_thirty_days;
            plotDiv.data[0].text = user_text_thirty_days;
            total.innerHTML = "Total messages: " +
                user_total_thirty_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_message_type');

    });

    $('#messages_by_type_ten_days_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_type_thirty_days_button').css('background', '#F0F0F0');
        $('#messages_by_type_cumulative_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_message_type');
        time_range = 'ten';
        if (type_data === 'realm') {
            plotDiv.data[0].values = realm_values_ten_days;
            plotDiv.data[0].text = realm_text_ten_days;
            total.innerHTML = "Total messages: " +
                realm_total_ten_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = user_values_ten_days;
            plotDiv.data[0].text = user_text_ten_days;
            total.innerHTML = "Total messages: " +
                user_total_ten_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_message_type');
    });

    $('#messages_by_type_thirty_days_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_type_ten_days_button').css('background', '#F0F0F0');
        $('#messages_by_type_cumulative_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_message_type');
        time_range = 'thirty';
        if (type_data === 'realm') {
            plotDiv.data[0].values = realm_values_thirty_days;
            plotDiv.data[0].text = realm_text_thirty_days;
            total.innerHTML = "Total messages: " +
                realm_total_thirty_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = user_values_thirty_days;
            plotDiv.data[0].text = user_text_thirty_days;
            total.innerHTML = "Total messages: " +
                user_total_thirty_days.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_message_type');
    });

    $('#messages_by_type_cumulative_button').click(function () {
        $(this).css('background', '#D8D8D8');
        $('#messages_by_type_thirty_days_button').css('background', '#F0F0F0');
        $('#messages_by_type_ten_days_button').css('background', '#F0F0F0');
        var plotDiv = document.getElementById('id_messages_sent_by_message_type');
        time_range = 'cumulative';
        if (type_data === 'realm') {
            plotDiv.data[0].values = realm_values_cumulative;
            plotDiv.data[0].text = realm_text_cumulative;
            total.innerHTML = "Total messages: " +
                realm_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            plotDiv.data[0].values = user_values_cumulative;
            plotDiv.data[0].text = user_text_cumulative;
            total.innerHTML = "Total messages: " +
                user_total_cumulative.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        Plotly.redraw('id_messages_sent_by_message_type');
    });
}

$.get({
    url: '/json/analytics/chart_data',
    data: {chart_name: 'messages_sent_by_message_type', min_length: '10'},
    idempotent: true,
    success: function (data) {
        populate_messages_sent_by_message_type(data);
    },
    error: function (xhr) {
        throw_error($.parseJSON(xhr.responseText).msg);
    },
});
