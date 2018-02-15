//получаем массив данных, чтобы избежать необходимости 
//обращаться к серверу на каждой итерации игры
$.ajax({
        url: "file.xml",
        dataType: "text",
        async: true,
        success: function(msg){
            start = msg.indexOf("Абаза");
            end = msg.indexOf("</города>");
            data = msg.substring(start, end);
            allCities = data.split(', ');
        }
    });

//Объявляем функцию для перемешивания элементов массива
//чтобы на ходе компьютера можно было просто выводить 
//первое подошедшее слово, без необходимости рандомного выбора

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
//Функция для приведения названий городов к одинаковому виду
function capitalizeFirstLetter(string) {
    return string.replace(/^./, string[0].toUpperCase());
}

//завершение игры
function finishGame(){
  $('.answers').css('display', 'block');
  $.each(userArr, function() {
    $('<li/>',{text:capitalizeFirstLetter(this)}).appendTo('.users_cities');
  });
  $.each(computerArr, function() {
    $('<li/>',{text:capitalizeFirstLetter(this)}).appendTo('.computer_cities');
  });
}

//проверка, есть ли подходящее слово
function isPositive(item) {
  return item.charAt(0) == lastLetter;
}

//ответ пользователя
function userEnter(){
	value = $('#cityName').val().toLowerCase();
	//проверяем, есть ли в массиве такой город
	if (allCities.indexOf(value) != -1) {
		//на случай повторов в массиве, проверяем, не был ли город уже назван
		if (userArr.indexOf(value) != -1 || computerArr.indexOf(value) != -1) {
			alert('Этот город уже называли');}
		//если это не самый первый ход, проверяем,
		//начинается ли слово с нужной буквы
		else if (computerArr.length > 0 && value.charAt(0) != newLetter) {
			alert('Слово должно начинаться на букву '+ newLetter);
			$('#cityName').val(newLetter.toUpperCase());
			return false;
		}
		else{
			//Если все условия выполнены, наносим город на карту, записываем
			// в массив Пользователя, удаляем из первоначального массива
			var objects = ymaps.geoQuery(ymaps.geocode())
       		.add(ymaps.geocode('г.' + value, {results: 1}))
      
	        .addToMap(myMap);

	         userArr.push(value);
	         allCities.splice([allCities.indexOf(value)], 1);

	        //запоминаем последнюю букву слова
	        theLetter = value[(value.length)-1];
	        //если это не ё, й, ъ, ь, ы
			if(theLetter != 'ё' && theLetter != 'й' && theLetter != 'ъ' && theLetter != 'ы' && theLetter !='ь'){
				lastLetter = theLetter;
			}
			else {
				//если это одна из перечисленных букв, проверяем предпоследнюю

				theSecondLetter = value[(value.length)-2];

				if(theSecondLetter != 'ё' && theSecondLetter != 'й' && theSecondLetter != 'ъ' && theSecondLetter != 'ы' && theSecondLetter !='ь'){
				lastLetter = theSecondLetter;
				}else{
					//если буква снова попадает в список, то записываем третью букву с конца
					lastLetter = value[(value.length)-3];
				}
			}
	     }
         //компьютер выводит слово
        var compWord;
        if (allCities.some(isPositive)) {
        	console.log('слово есть');
        	for (var i = 0; i < allCities.length; i++) {
        	//удаляем повторы в массиве
        	if (userArr.indexOf(allCities[i]) != -1 || computerArr.indexOf(allCities[i]) != -1) {
        		allCities.splice([i], 1);
        	}
        	else if (allCities[i].charAt(0) == lastLetter ) {
        		compWord = allCities[i];
        		break;
        	}
        }
        computerArr.push(compWord);
        allCities.splice([allCities.indexOf(compWord)], 1);

     	console.log(allCities.length)
		alert(capitalizeFirstLetter(compWord));
		
        objects.add(ymaps.geocode('г.' + compWord, {results: 1})).addToMap(myMap);
        lastLetter = compWord.slice(-1);

		if(lastLetter != 'ё' && lastLetter != 'й' && lastLetter != 'ъ' && lastLetter != 'ы' && lastLetter !='ь'){
			newLetter = compWord.slice(-1);
		}else{
			newLetter = compWord.slice(-2, -1);
		}
		$('#cityName').val(newLetter.toUpperCase());
        }
        else{
        	alert('Поздравляю, ты выйграл!');
        	finishGame();
        	$('.result h2').text( 'Ты победил!' );
        }
        			
    }
	else{
		//Если город в массиве отсутствует, проверяем, есть ли он в массиве Пользователя или Компьютера, выводим сообщение
		if (userArr.indexOf(value) != -1 || computerArr.indexOf(value) != -1) {
			alert('Этот город уже называли');
		}
		else{
			alert('К сожалению, такой город не найден :(');
		}
	}

}

//По готовности карты запускаем функцию
ymaps.ready(init);
var myMap;

var userArr = [],//массив Пользователя
computerArr = [],//массив Компьютера
newLetter;//Первая буква слова

function init() {

	//Перемешиваем и перезаписываем массив

	allCities = shuffle(allCities);
	var clone = [];
	allCities.forEach(function(entry) {
	    w = entry.toLowerCase();
	    clone.push(w);
	});
	allCities = clone;

	//Создаем карту

    var myMap = new ymaps.Map('map', {
        center: [39.267067, 22.302411],
        zoom: 2,
        controls: []
    });
    //Подключаем голосовой ввод
    var textline = new ya.speechkit.Textline('voise', {
        apikey: '712092b8-289b-4eb4-b436-ebc866975e25',
        onInputFinished: function(text) {
    //убираем пробелы и вносим произнесенное слово в пользовательский инпут
        	text = text.trim()
        	$('#cityName').val(text);
        }
      });

    //По клику на кнопку 'отправить' проверяем введенные данные
	$('#submitButton').click(userEnter);
	$(document).keypress(function(e) {
	    if(e.which == 13) {
	        userEnter()
	    }
	});
	$('#finishGame').click(function(){
		$('.result h2').text( 'Комьютер победил!' );
		finishGame();
	});
}
