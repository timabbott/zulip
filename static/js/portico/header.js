import $ from "jquery";

$(() => {
    $(".portico-header li.logout").on("click", () => {
        $("#logout_form").trigger("submit");
        return false;
    });

    $("body").on("click", (e) => {
        const $this = $(e.target);

        if (
            $this.closest(".dropdown .dropdown-pill").length > 0 &&
            !$(".dropdown").hasClass("show")
        ) {
            $(".dropdown").addClass("show");
        } else if (!$this.is(".dropdown ul") && $this.closest(".dropdown ul").length === 0) {
            $(".dropdown").removeClass("show");
        }
    });

    // Scroll to anchor link when clicked
    $(document).on("click", ".markdown h1, .markdown h2, .markdown h3", function () {
        window.location.hash = $(this).attr("id");
    });
});
