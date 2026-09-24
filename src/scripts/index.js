/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/


import "../pages/index.css"; 

import { createCardElement, updateLikeStatus, getLikeStatus, removeCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";

import { enableValidation, clearValidation } from "./components/validation.js";
import { getUserInfo, getCardList, setUserInfo, updateAvatar, addNewCard, deleteCardFromServer, changeLikeCardStatus } from "./components/api.js";

// Конфигурационный объект со всеми селекторами и классами
const validationConfig = {
  formSelector: '.popup__form',
  inputSelector: '.popup__input',
  submitButtonSelector: '.popup__button',
  inactiveButtonClass: 'popup__button_disabled',
  inputErrorClass: 'popup__input_type_error',
  errorClass: 'popup__error_visible'
};

// Глобальная переменная для хранения ID 
let userId = "";

// DOM узлы общего интерфейса
const placesWrap = document.querySelector(".places__list");
const logoElement = document.querySelector(".header__logo");

const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

//узлы для модального окна статистики
const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info"); // Строка 58!
const usersStatsModalUsersList = usersStatsModalWindow.querySelector(".popup__list");

//генерация статистики
const infoDefinitionTemplate = document.querySelector("#popup-info-definition-template").content;
const infoUserPreviewTemplate = document.querySelector("#popup-info-user-preview-template").content;

//форматирование даты 
const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Функция создания строки описания статистики
const createInfoString = (term, description) => {
  const element = infoDefinitionTemplate.querySelector(".popup__info-item").cloneNode(true);
  element.querySelector(".popup__info-term").textContent = term;
  element.querySelector(".popup__info-description").textContent = description;
  return element;
};

// Функция создания бэджа пользователя 
const createUserBadge = (userName) => {
  const element = infoUserPreviewTemplate.querySelector(".popup__list-item_type_badge").cloneNode(true);
  element.textContent = userName;
  return element;
};

// Функция-обработчик клика на логотип
const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      // очистка старых данных перед новым рендером
      usersStatsModalInfoList.innerHTML = "";
      usersStatsModalUsersList.innerHTML = "";

      if (cards.length === 0) {
        usersStatsModalInfoList.append(createInfoString("Статус:", "Карточек пока нет"));
        openModalWindow(usersStatsModalWindow);
        return;
      }

      //точное определение границ времени
      const sortedCards = [...cards].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const earliestDate = new Date(sortedCards[0].createdAt);
      const latestDate = new Date(sortedCards[sortedCards.length - 1].createdAt);

      //карточки по создателям для подсчёта уникальных юзеров и их максимумов
      const userCardsCount = {};
      const userNames = {};

      cards.forEach((card) => {
        if (card.owner) {
          const ownerId = card.owner._id;
          userCardsCount[ownerId] = (userCardsCount[ownerId] || 0) + 1;
          userNames[ownerId] = card.owner.name;
        }
      });

      const uniqueUsersIds = Object.keys(userCardsCount);
      const totalUsers = uniqueUsersIds.length;
      const maxCardsFromOne = totalUsers > 0 ? Math.max(...Object.values(userCardsCount)) : 0;

      //строка общей статистики
      usersStatsModalInfoList.append(createInfoString("Первая создана:", formatDate(earliestDate)));
      usersStatsModalInfoList.append(createInfoString("Последняя создана:", formatDate(latestDate)));
      usersStatsModalInfoList.append(createInfoString("Всего пользователей:", totalUsers));
      usersStatsModalInfoList.append(createInfoString("Максимум карточек от одного:", maxCardsFromOne));

      // Рендер списка всех уникальных авторов
      uniqueUsersIds.forEach((id) => {
        usersStatsModalUsersList.append(createUserBadge(userNames[id]));
      });

      openModalWindow(usersStatsModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

const renderLoading = (isLoading, buttonElement, loadingText = "Сохранение...", defaultText = "Сохранить") => {
  if (isLoading) {
    buttonElement.textContent = loadingText;
  } else {
    buttonElement.textContent = defaultText;
  }
};

// обработка лайка карточки
const likeCard = (likeButton, likeCountElement, cardId) => {
  const isLiked = getLikeStatus(likeButton);

  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCardData) => {
      updateLikeStatus(likeButton, likeCountElement, updatedCardData.likes, userId);
    })
    .catch((err) => {
      return Promise.reject(err);
    });
};

const deleteCard = (cardElement, cardId) => {
  deleteCardFromServer(cardId)
    .then(() => {
      removeCardElement(cardElement);
    })
    .catch((err) => {
      return Promise.reject(err);
    });
};

// открытие превью картинки
const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

// Обработчик отправки формы «Редактировать профиль»
const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter || evt.target.querySelector('.popup__button');
  renderLoading(true, submitButton, "Сохранение...", "Сохранить");

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, submitButton, "Сохранение...", "Сохранить");
    });
};

// Обработчик отправки формы «Обновить аватар»
const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter || evt.target.querySelector('.popup__button');
  renderLoading(true, submitButton, "Сохранение...", "Сохранить");

  updateAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, submitButton, "Сохранение...", "Сохранить");
    });
};

// Обработчик отправки формы «Новое место»
const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter || evt.target.querySelector('.popup__button');
  renderLoading(true, submitButton, "Создание...", "Создать");

  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(
          cardData,
          {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: likeCard,
            onDeleteCard: deleteCard,
          },
          userId
        )
      );
      cardForm.reset();
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, submitButton, "Создание...", "Создать");
    });
};

// Установка слушателей на кнопки отправки
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);

// Слушатели открытия модальных окон
openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationConfig);
  openModalWindow(profileFormModalWindow);});

profileAvatar.addEventListener("click", () => {avatarForm.reset();
  clearValidation(avatarForm, validationConfig);
  openModalWindow(avatarFormModalWindow);
  });

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationConfig);
  openModalWindow(cardFormModalWindow);
  });

  // Слушатель на логотип для открытия статистики
logoElement.addEventListener("click", handleLogoClick);

// Настройка закрытия всех попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
  });

// Запуск валидации всех форм
enableValidation(validationConfig);

// Одновременная загрузка данных пользователя и списка карточек 
Promise.all([getCardList(), getUserInfo()])
.then(([cards, userData]) => {
  profileTitle.textContent = userData.name;
  profileDescription.textContent = userData.about;
  const userAvatarUrl = userData.avatar ? userData.avatar : 'https://unsplash.com';
profileAvatar.style.backgroundImage = `url(${userAvatarUrl})`;
  // Сохранение уникального idпользователя
  userId = userData._id;
  // Первичная отрисовка
  cards.forEach((cardData) => {
    placesWrap.append(
      createCardElement(cardData, {
        onPreviewPicture: handlePreviewPicture,
        onLikeIcon: likeCard,
        onDeleteCard: deleteCard,
        }, userId));
        });
        })
        .catch((err) => {
          console.log(err);
          });
