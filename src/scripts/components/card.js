// Функция получения шаблона
const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const removeCardElement = (cardElement) => {
  cardElement.remove();
};

// Функция для обновления отображения лайков
export const updateLikeStatus = (likeButton, likeCountElement, likesArray, userId) => {
  likeCountElement.textContent = likesArray ? likesArray.length : 0;

  const isLiked = likesArray && likesArray.some((like) => like._id === userId);
  
  if (isLiked) {
    likeButton.classList.add("card__like-button_is-active");
  } else {
    likeButton.classList.remove("card__like-button_is-active");
  }
};

export const getLikeStatus = (likeButton) => {
  return likeButton.classList.contains("card__like-button_is-active");
};

// Функция создания карточки
export const createCardElement = (
  data,
  { onPreviewPicture, onLikeIcon, onDeleteCard },
  userId
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardElement.querySelector(".card__title").textContent = data.name;

  updateLikeStatus(likeButton, likeCountElement, data.likes, userId);

  //корзина удаления
  if (data.owner && data.owner._id !== userId) {
    deleteButton.remove();
  } else if (onDeleteCard) {
    deleteButton.addEventListener("click", () => onDeleteCard(cardElement, data._id));
  }

  if (onLikeIcon) {
    likeButton.addEventListener("click", () => onLikeIcon(likeButton, likeCountElement, data._id));
  }

  if (onPreviewPicture) {
    cardImage.addEventListener("click", () => onPreviewPicture({ name: data.name, link: data.link }));
  }

  return cardElement;
};
