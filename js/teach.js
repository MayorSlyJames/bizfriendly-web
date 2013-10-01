var teach = (function (teach) {

  var user_id = false;
  var newSteps = [];
  var currentStep = {};
  var categoryId;
  var categoryName;
  var serviceId;
  var serviceName;
  var lessonId;
  var lessonName;
  var lessonNames = [];
  var stepType;
  var stepText;
  var openUrl;

  // PUBLIC METHODS
  function init(){
    // if (config.debug) console.log('init');
    _main();
  }

  // PRIVATE METHODS
  function _main(){
    $('.draggable').draggable({ revert: true });
    // Make sure they are logged in
    _checkIfLoggedIn();
    // Get all the existing categories
    _getCategories();
    // Make lesson name editable
    _editLessonName();
    // Add the first Step
    _addFirstStep();
    // Add the congrats step
    _addCongratsStep();
    // Turn on Drag
    // $('.draggable').draggable({ revert: true });
    // Controls
    $("#back").click(_backStep);
    $('#next').click(_nextStep);
    $('#add-new-step').click(_addNewStep);
    $("#preview").click(_previewClicked);
    $("#save-draft").click(_saveDraft);
    $(".close").click(_closeClicked);
    // $('#new-lesson-btn').click(_postNewLesson);
    // $('#new-step-btn').click(_postNewStep);

  }

  function _checkIfLoggedIn(){
    // Check if user is logged in
    // If not, dont let them build a lesson
    // If so, show their name as the author
    if (!BfUser.bfAccessToken){
      $('#teach-main').hide();
      $('.login-required').show();
    } else {
      // if (config.debug) console.log('Logged In');
      $(".author-name").text(BfUser.name);
    }
  }

  function _getCategories(){
    // Get the existing categories
    // TODO: Only show published categories
    $.get(config.bfUrl+config.bfApiVersion+'/categories', function(response){
      $.each(response.objects, function(i){
        if (response.objects[i].state == "published"){
          $('#category-id').append('<option value='+response.objects[i].id+'>'+response.objects[i].name+'</option>');
        }
      })
      $('#category-id').append('<option value="add-new-category">Add new category</option>');
      $('.selectpicker').selectpicker('refresh');
      _watchCategory();
      // Get all the existing services
      // console.log($("#category-id").html());
      _getServices();
    })
  }

  function _watchCategory(){
    // Add a listener to the category menu.
    // If they choose to add a new category, open that page.
    $("#lesson-form").on("change", "#category-id", function(){
      if ($("#category-id").val() == "add-new-category"){
        window.open("http://bizfriend.ly/add-new-category.html");
      } else {
        categoryId = $("#category-id").val();
        categoryName = $("#category-id :selected").text();
      }
      _getServices();
      // if (config.debug) console.log("Category ID: " + categoryId);
    });
  }

  function _getServices(){
    // Get existing services
    // TODO : Only show published services.
    $("#service-id").empty();
    categoryId = $("#category-id").val();
    $.get(config.bfUrl+config.bfApiVersion+'/services', function(response){
      // $(".service-name").text(serviceName); // Init the service-name
      $.each(response.objects, function(i){
        if (response.objects[i].category_id == categoryId){
          $('#service-id').append('<option value='+response.objects[i].id+'>'+response.objects[i].name+'</option>');
        }
      })
      $('#service-id').append('<option value="add-new-service">Add new service</option>');
      $('.selectpicker').selectpicker('refresh');
      // Init the service-name
      serviceName = $('#service-id :selected').text();
      $(".service-name").text(serviceName);
      serviceId = parseInt($("#service-id").val());
      _watchServices();
    })
  }

  function _watchServices(){
    // Add listener to services menu
    // If they choose to add a new one, open that page
    $("#lesson-form").on("change", "#service-id", function(){
      if ($("#service-id").val() == "add-new-service"){
        window.open("http://bizfriend.ly/add-new-service.html");
      } else {
        serviceId = $("#service-id").val();
        serviceName = $('#service-id :selected').text();
        $(".service-name").text(serviceName);
      }
      // if (config.debug) console.log("Service ID: " + serviceId);
    });
  }

  // Make lesson name editable
  function _editLessonName(){
    $('.lesson-editable').editable(function(value, settings) {
      return(value)
      }, { 
        submit  : 'OK'
    });
  }

  function _addFirstStep(){
    // Create a new step
    currentStep = {
        step_number : 1,
        step_type : "",
        step_text : "",
        creator_id : BfUser.id
      }
    // Save current step
    newSteps.push(currentStep);
    _updateProgressBar();
  }

  function _addNewStep(){
    // Create a new step
    currentStep = {
      step_number : newSteps.length,
      step_type : "",
      step_text : "",
      step_state : "active",
      creator_id : BfUser.id
    }
    // Keep congrats at the last step
    if (newSteps[newSteps.length-1].step_type == "congrats"){
      newSteps[newSteps.length-1].step_number = newSteps.length + 1;
      newSteps[newSteps.length-1].step_state = "unfinished";
    }
    // Add new blank step as second to last position
    newSteps.splice(newSteps.length-1, 0, currentStep)

    // Show new step
    _showCurrentStep();
  }

  function _saveCurrentStep(){
    // Save the active step-texts in currentStep
    // TODO: Save feedback too
    stepText = "";
    $.each($("#step-texts .active"), function(i){
      stepText += $("#step-texts .active")[i].outerHTML;
    })
    currentStep.step_text = stepText;
    // Then add it to newSteps
    $.each(newSteps, function(i){
      if (newSteps[i].step_number == currentStep.step_number){
        newSteps[i] = currentStep;
      }
    });
  }

  function _showCurrentStep(){
    console.log(newSteps);
    // Update all step states
    _updateStepsStates();
    // Update progress bar
    _updateProgressBar();
    $("#step-texts").html(currentStep.step_text);
    // Show three new temp texts
    if (currentStep.step_type != "congrats"){
      while ($("#step-texts").children().length < 3){
        var $clone = $("#droppable-prototype").clone();
        // Clean it up
        $clone.attr("id","").removeClass("hidden");
        $("#step-texts").append($clone);
      }
    } else {
      // Add congrats-icon
      var content = $("#congrats-popover").html();
      $(".congrats-img").popover({ content: content, html: true, placement: 'right' });
      $('.congrats-img').on('shown.bs.popover', function () {
        // Turn on controllers
        $(".star-icon").click(_iconClicked);
        $(".flag-icon").click(_iconClicked);
        $(".heart-icon").click(_iconClicked);
        $(".thumbs-up-icon").click(_iconClicked);
      }) 
      $(".congrats-img").popover("show");
    }
    // Turn on drop
    _turnOnDrop();
  }

  function _iconClicked(evt){
    $(".congrats-img").attr("src",$(this).attr("src"));
    $(".congrats-img").popover("hide")
  }

  // Update the progress bar
  function _updateProgressBar(){
    // if (config.debug) console.log('updating progress bar');
    // Check number of dots
    if ($(".progress-dots li").length < newSteps.length){
      $('.progress-dots').append('<li class="step'+newSteps[newSteps.length-1].step_number+'_progress progress-button" data-target="'+newSteps[newSteps.length-1].step_number+'"></li>');
    }
    $(newSteps).each(function(i){
      $('.step'+newSteps[i].step_number+'_progress').removeClass('unfinished active finished').addClass(newSteps[i].step_state);
      if (newSteps[i].step_number == currentStep.step_number){
        $('.step'+newSteps[i].step_number+'_progress').html('<h2>'+currentStep.step_number+'</h2>');
      } else {
        $('.step'+newSteps[i].step_number+'_progress').html('');
      }
    })
  }

  function _makeEditable($clone){
    // Make editable
    $clone.children("p").addClass("element-editable");
    $('.element-editable').editable(function(value, settings) {
      return (value);
    },{
      type : "textarea",
      rows : 3,
      submit : "OK"
    });
  }

  function _turnOnDrop(){
    $( ".droppable" ).droppable({
      drop: function( event, ui ) {
        $( this ).children(".temp-text").remove();
        $( this ).removeClass("temp").addClass("active");
        $( this ).removeClass("droppable ui-droppable");

        // Add colorPopover
        var content = $("#popover").html();
        $(this).popover({ content: content, html: true, placement: 'right' });
        // Have to repeat for inadvertant popups
        $(this).on('shown.bs.popover', function () {
          _colorControllers();
        })
        $(this).popover("show");
        
        // If text-element
        if ($(ui.draggable[0]).attr("id") == "text-element-drag"){
          var $clone = $("#text-prototype").clone();
          $clone.attr("id","").removeClass("hidden");
          $clone.appendTo( this );
          _makeEditable($clone);
        }
        // If open-element
        if ($(ui.draggable[0]).attr("id") == "open-element-drag"){
          currentStep.step_type = "open";
          $("#login-element-drag").addClass("disabled").draggable("disable");

          var $clone = $("#open-prototype").clone();
          $clone.attr("id","").removeClass("hidden");
          $clone.appendTo( this );
          _makeEditable($clone);

          $("#open").click(function(){
            console.log("open clicked");
            var content = '<p>What web address to open?</p><input id="open-url" type="url"></input><button id="open-url-submit">OK</button>';
            $('#open').popover({ content: content, html: true, placement: 'right' });
            $('#open').popover("show");
            $("#open-url-submit").click(function(){
              currentStep.trigger_endpoint = $("#open-url").val();
              console.log(currentStep);
              $("#open").popover("hide");
            })
          })
        }

        // If login-element
        if ($(ui.draggable[0]).attr("id") == "login-element-drag"){
          $("#open-element-drag").addClass("disabled").draggable("disable");
          var $clone = $("#login-prototype").clone();
          $clone.attr("id","").removeClass("hidden");
          $clone.appendTo( this );
          _makeEditable($clone);
        }

        // If text-entry-element
        if ($(ui.draggable[0]).attr("id") == "text-entry-element-drag"){
          var $clone = $("#text-entry-prototype").clone();
          $clone.attr("id","").removeClass("hidden");
          $clone.appendTo( this );
          _makeEditable($clone);
        }

        // If image-element
        if ($(ui.draggable[0]).attr("id") == "image-element-drag"){
          var $clone = $("#image-prototype").clone();
          $clone.attr("id","").removeClass("hidden");
          $clone.appendTo( this );
          $("#fileupload").attr("data-url",config.bfUrl+"/image_upload");
          _makeEditable($clone);
          $('#fileupload').fileupload({
              dataType: 'json',
              done: function (e, data) {
                  $.each(data.result.files, function (index, file) {
                      // console.log(index);
                      // console.log(file);
                      $("#img-upload-form").remove();
                      $(".image-element").append('<img src="'+file.url+'">');
                  });
              },
              progressall: function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#progress .progress-bar').css(
                    'width',
                    progress + '%'
                );
              },
              error : function(response){
                response = $.parseJSON(response.responseText);
                $('#img-upload-form').append(response["message"]);
                // console.log(response.responseText);
              }
          });
        }
      }
    });
  }

  function _colorControllers(){
    $(".orange-square").click(function(evt){
      $(this).parent().parent().prev().css("background-color","#ff4000");
      $(this).parent().parent().prev().popover("hide");
    })
    $(".blue-square").click(function(evt){
      $(this).parent().parent().prev().css("background-color","#74BBD4");
      $(this).parent().parent().prev().popover("hide");
    })
    $(".white-square").click(function(evt){
      $(this).parent().parent().prev().css("background-color","#FFFFFF");
      $(this).parent().parent().prev().popover("hide");
    })
  }

  // Set the newSteps state
  function _updateStepsStates(){
    // if (config.debug) console.log('updating newSteps states');
    $(newSteps).each(function(i){
      if (currentStep.step_number == newSteps[i].step_number){
        newSteps[i].step_state = "active";
      }
      if (currentStep.step_number > newSteps[i].step_number){
        newSteps[i].step_state = "finished";
      }
      if (currentStep.step_number < newSteps[i].step_number){
        newSteps[i].step_state = "unfinished";
      }
    })
    // Set current-dot
    $("#current-dot").html("<h2>"+currentStep.step_number+"</h2>");
  }

  function _backStep(evt){
    _saveCurrentStep();
    if (currentStep.step_number > 1) {
      currentStep = newSteps[currentStep.step_number - 2];
      _showCurrentStep();
    }
  }

  function _nextStep(evt){
    _saveCurrentStep();
    if (currentStep.step_number < newSteps.length){
      currentStep = newSteps[currentStep.step_number];
      _showCurrentStep();
    }
  }

  function _closeClicked(evt){
    console.log("close clicked");
    // Erase the thing that this button is within.
    $(".active").popover("hide");
    $(this).parent().remove();
    if ($("#add-droppable").length == 0){
      $('#teach-instructions').append('<a id="add-droppable">Add another element</a>');
      $("#add-droppable").click(_addDroppableClicked);
    }
    // Turn disabled elements back on
    if ($(this).siblings().attr("class") == "open-element" || $(this).siblings().attr("class") == "login-element") {
      $("#elements ul li").removeClass("disabled").draggable("enable");
    }
  }

  function _addDroppableClicked(evt){
    // $clone the prototype
    var $clone = $("#droppable-prototype").clone();
    // Clean it up
    $clone.attr("id","").removeClass("hidden");
    $("#step-texts").append($clone);
    _turnOnDrop();
    // If there are three (and the hidden prototype) then dont add more
    if ($(".droppable").length == 4){
      $("#add-droppable").remove();
    }
    $(".close").click(_closeClicked);
  }

  function _addCongratsStep(){
    // Create a new step
    currentStep = {
      step_number : 2,
      step_type : "",
      step_text : "",
      creator_id : BfUser.id
    }
    // Add it to the list
    newSteps.push(currentStep);
    // Add the congratulations step
    var $clone = $("#congrats-prototype").clone();
    // Clean it up
    $clone.removeAttr("id").removeClass("hidden");
    $("#step-texts").empty();
    $("#step-texts").append($clone);
    currentStep.step_type = "congrats";
    _saveCurrentStep();

    // Go back to first step
    currentStep = newSteps[0];
    _showCurrentStep();
  }

  function _cleanUpStepsHTML(){
    stepText = "";
    $.each(newSteps, function(i){
      stepText = newSteps[i].step_text;
      console.log(stepText);
      stepText = stepText.replace('<button type="button" class="close" aria-hidden="true">×</button>', "");
      stepText = stepText.replace(/(\r\n|\n|\r)/gm,"");
      stepText = stepText.replace(/\s+/g," ");
      newSteps[i].step_text = stepText;
    })
  }

  function _previewClicked(evt){
    _saveCurrentStep();

    document.preview.lessonName.value = $("#lesson-name").text();

    _cleanUpStepsHTML();
    document.preview.steps.value =JSON.stringify(newSteps);


    var url = 'preview.html';
    var width = 340;
    var height = window.screen.height;
    var left = window.screen.width - 340;
    var instructionOptions = "height="+height+",width="+width+",left="+left;
    window.open(url,"instructions",instructionOptions);
  }

  function _saveDraft(){
    _saveCurrentStep();
    _cleanUpStepsHTML()
    _checkForLesson();
  }

  function _checkForLesson(){
    // Post draft lesson
    lessonName = $("#lesson-name").text();
    var filters = [{"name": "name", "op": "==", "val": lessonName}];
    $.ajax({
      url: config.bfUrl+config.bfApiVersion+'/lessons',
      data: {"q": JSON.stringify({"filters": filters}), "single" : true},
      dataType: "json",
      contentType: "application/json",
      success: function(data) {
        // Lesson already exists, just get the id
        console.log(data);
        if (data.num_results){
          lessonId = data.objects[0].id; 
          _postDraftSteps();
        } else {
          // Lesson doesn't exist, post it
          _postDraftLesson();
        }
      },
      error : function(error){
        console.log(error);
      }
    });
  }

  function _postDraftLesson(){
    newLesson = {
      service_id : serviceId,
      creator_id : BfUser.id,
      name : lessonName,
      state : "draft"
    }
    $.ajax({
      type: "POST",
      contentType: "application/json",
      url: config.bfUrl+config.bfApiVersion+'/lessons',
      data: JSON.stringify(newLesson),
      dataType: "json",
      success : function(){
        _checkForLesson();
      },
      error : function(){
        console.log('Lesson not posted.')
      }
    });
  }

  function _postDraftSteps(){
    $.each(newSteps, function (i){
      // Clean up
      newSteps[i].lesson_id = lessonId;
      delete newSteps[i].step_state; // active or unfinished, not draft or published, not needed
      console.log(JSON.stringify(newSteps[i]));
      $.ajax({
        type: "POST",
        contentType: "application/json",
        url: config.bfUrl+config.bfApiVersion+'/steps',
        data: JSON.stringify(newSteps[i]),
        dataType: "json",
        success : function(){
          // console.log("yes")
          window.location.replace("submission-complete.html");
        },
        error : function(){
          console.log("Step not posted?");
        }
      });
    });
  }

  // add public methods to the returned module and return it
  teach.init = init;
  return teach;
}(teach || {}));

// initialize the module
teach.init()