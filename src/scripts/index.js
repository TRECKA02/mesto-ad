/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { createCardElement, updateLikeStatus } from "./components/card.js";
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

// Глобальная переменная для хранения ID текущего пользователя
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

// DOM узлы для модального окна статистики
const usersStatsModalWindow = document.querySelector(".popup_type_info");
const usersStatsModalInfoList = usersStatsModalWindow.querySelector(".popup__info"); // Строка 58!
const usersStatsModalUsersList = usersStatsModalWindow.querySelector(".popup__list");

// Шаблоны для генерации статистики
const infoDefinitionTemplate = document.querySelector("#popup-info-definition-template").content;
const infoUserPreviewTemplate = document.querySelector("#popup-info-user-preview-template").content;

// Вспомогательная функция для форматирования даты в формат "ДД месяц ГГГГ"
const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Функция создания строки описания статистики из темплейта (<dl>)
const createInfoString = (term, description) => {
  const element = infoDefinitionTemplate.querySelector(".popup__info-item").cloneNode(true);
  element.querySelector(".popup__info-term").textContent = term;
  element.querySelector(".popup__info-description").textContent = description;
  return element;
};

// Функция создания бэджа пользователя из темплейта (<li>)
const createUserBadge = (userName) => {
  const element = infoUserPreviewTemplate.querySelector(".popup__list-item_type_badge").cloneNode(true);
  element.textContent = userName;
  return element;
};

// Функция-обработчик клика на логотип (расчёт статистики проекта)
const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      // Очищаем списки от старых данных перед новым рендером
      usersStatsModalInfoList.innerHTML = "";
      usersStatsModalUsersList.innerHTML = "";

      if (cards.length === 0) {
        usersStatsModalInfoList.append(createInfoString("Статус:", "Карточек пока нет"));
        openModalWindow(usersStatsModalWindow);
        return;
      }

      // Сортируем копию массива по дате создания для точного определения границ времени
      const sortedCards = [...cards].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const earliestDate = new Date(sortedCards[0].createdAt);
      const latestDate = new Date(sortedCards[sortedCards.length - 1].createdAt);

      // Группируем карточки по создателям для подсчёта уникальных юзеров и их максимумов
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

      // Добавляем строки общей статистики
      usersStatsModalInfoList.append(createInfoString("Первая создана:", formatDate(earliestDate)));
      usersStatsModalInfoList.append(createInfoString("Последняя создана:", formatDate(latestDate)));
      usersStatsModalInfoList.append(createInfoString("Всего пользователей:", totalUsers));
      usersStatsModalInfoList.append(createInfoString("Максимум карточек от одного:", maxCardsFromOne));

      // Рендерим список всех уникальных авторов
      uniqueUsersIds.forEach((id) => {
        usersStatsModalUsersList.append(createUserBadge(userNames[id]));
      });

      openModalWindow(usersStatsModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Универсальная функция для управления текстом кнопок во время запросов (UX)
const renderLoading = (isLoading, buttonElement, loadingText = "Сохранение...", defaultText = "Сохранить") => {
  if (isLoading) {
    buttonElement.textContent = loadingText;
  } else {
    buttonElement.textContent = defaultText;
  }
};

// Колбэк обработки лайка карточки
const likeCard = (likeButton, likeCountElement, cardId) => {
  const isLiked = likeButton.classList.contains("card__like-button_is-active");
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCardData) => {
      updateLikeStatus(likeButton, likeCountElement, updatedCardData.likes, userId);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Колбэк удаления карточки
const deleteCard = (cardElement, cardId) => {
  deleteCardFromServer(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch((err) => {
      console.log(err);
    });
};

// Колбэк открытия превью картинки
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

// Слушатели открытия модальных окон с очисткой ошибок валидации
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

// Настройка закрытия всех попапов (по оверлею и крестику)
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
  });

// Запуск валидации всех форм проекта
enableValidation(validationConfig);

// Одновременная загрузка данных пользователя и списка карточек с сервера при старте
Promise.all([getCardList(), getUserInfo()])
.then(([cards, userData]) => {
  profileTitle.textContent = userData.name;
  profileDescription.textContent = userData.about;
  const userAvatarUrl = userData.avatar ? userData.avatar : 'https://unsplash.com';
profileAvatar.style.backgroundImage = `url(${userAvatarUrl})`;
  // Сохраняем уникальный id текущего пользователя
  userId = userData._id;
  // Первичная отрисовка всех карточек на странице
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
