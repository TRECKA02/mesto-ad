// Настройки для работы с API
const config = {
  baseUrl: "https://mesto.nomoreparties.co/v1/apf-cohort-203", // Замените на ваш идентификатор группы
  headers: {
    authorization: "fbd94c6d-6e1f-492a-b1d7-25b87eca2cca", // Замените на ваш личный токен
    "Content-Type": "application/json",
  },
};

/* Проверяем, успешно ли выполнен запрос, и отклоняем промис в случае ошибки. */
const getResponseData = (res) => {
  return res.ok ? res.json() : Promise.reject(`Ошибка: ${res.status}`);
};

// Получить информацию о пользователе с сервера (GET)
export const getUserInfo = () => {
  return fetch(`${config.baseUrl}/users/me`, {
    headers: config.headers,
  }).then(getResponseData);
};

// Получить список карточек с сервера (GET)
export const getCardList = () => {
  return fetch(`${config.baseUrl}/cards`, {
    headers: config.headers,
  }).then(getResponseData);
};

export const setUserInfo = ({ name, about }) => {
  return fetch(`${config.baseUrl}/users/me`, {
    method: "PATCH",
    headers: config.headers,
    body: JSON.stringify({
      name,
      about,
    }),
  }).then(getResponseData);
};

// Обновить аватар пользователя на сервере (PATCH)
export const updateAvatar = (avatarLink) => {
  return fetch(`${config.baseUrl}/users/me/avatar`, {
    method: "PATCH",
    headers: config.headers,
    body: JSON.stringify({
      avatar: avatarLink,
    }),
  }).then(getResponseData);
};

// Добавить новую карточку на сервер (POST)
export const addNewCard = ({ name, link }) => {
  return fetch(`${config.baseUrl}/cards`, {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({
      name,
      link,
    }),
  }).then(getResponseData);
};

// Удалить карточку с сервера (DELETE)
export const deleteCardFromServer = (cardId) => {
  return fetch(`${config.baseUrl}/cards/${cardId}`, {
    method: "DELETE",
    headers: config.headers,
  }).then(getResponseData);
};

// Постановка и снятие лайка (PUT / DELETE)
export const changeLikeCardStatus = (cardId, isLiked) => {
  return fetch(`${config.baseUrl}/cards/likes/${cardId}`, {
    method: isLiked ? "DELETE" : "PUT",
    headers: config.headers,
  }).then(getResponseData);
};

