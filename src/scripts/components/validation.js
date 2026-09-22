// Отображает сообщение об ошибке под невалидным полем
const showInputError = (formElement, inputElement, errorMessage, config) => {
  const errorElement = formElement.querySelector(`#${inputElement.id}-error`);
  inputElement.classList.add(config.inputErrorClass);
  errorElement.textContent = errorMessage;
  errorElement.classList.add(config.errorClass);
};

// Скрывает сообщение об ошибке
const hideInputError = (formElement, inputElement, config) => {
  const errorElement = formElement.querySelector(`#${inputElement.id}-error`);
  inputElement.classList.remove(config.inputErrorClass);
  errorElement.classList.remove(config.errorClass);
  errorElement.textContent = '';
};

// Проверяет валидность конкретного поля
const checkInputValidity = (formElement, inputElement, config) => {
  if (inputElement.validity.patternMismatch) {
    showInputError(formElement, inputElement, inputElement.dataset.errorMessage, config);
  } else if (!inputElement.validity.valid) {
    showInputError(formElement, inputElement, inputElement.validationMessage, config);
  } else {
    hideInputError(formElement, inputElement, config);
  }
};

// Возвращает true, если хотя бы одно поле формы не прошло валидацию
const hasInvalidInput = (inputList) => {
  return inputList.some((inputElement) => !inputElement.validity.valid);
};

// Делает кнопку формы неактивной
const disableSubmitButton = (buttonElement, config) => {
  buttonElement.disabled = true;
  buttonElement.classList.add(config.inactiveButtonClass);
};

// Включает кнопку формы
const enableSubmitButton = (buttonElement, config) => {
  buttonElement.disabled = false;
  buttonElement.classList.remove(config.inactiveButtonClass);
};

// Управляет состоянием кнопки в зависимости от валидности полей
const toggleButtonState = (inputList, buttonElement, config) => {
  if (hasInvalidInput(inputList)) {
    disableSubmitButton(buttonElement, config);
  } else {
    enableSubmitButton(buttonElement, config);
  }
};

// Добавляет обработчики события input для всех полей формы
const setEventListeners = (formElement, config) => {
  const inputList = Array.from(formElement.querySelectorAll(config.inputSelector));
  const buttonElement = formElement.querySelector(config.submitButtonSelector);

  toggleButtonState(inputList, buttonElement, config);

  inputList.forEach((inputElement) => {
    inputElement.addEventListener('input', () => {
      checkInputValidity(formElement, inputElement, config);
      toggleButtonState(inputList, buttonElement, config);
    });
  });
};

// Очищает ошибки валидации формы и делает кнопку неактивной
export const clearValidation = (formElement, config) => {
  const inputList = Array.from(formElement.querySelectorAll(config.inputSelector));
  const buttonElement = formElement.querySelector(config.submitButtonSelector);

  inputList.forEach((inputElement) => {
    hideInputError(formElement, inputElement, config);
  });

  disableSubmitButton(buttonElement, config);
};

// Отвечает за включение валидации всех форм на странице
export const enableValidation = (config) => {
  const formList = Array.from(document.querySelectorAll(config.formSelector));
  formList.forEach((formElement) => {
    setEventListeners(formElement, config);
  });
};
