const { Keyboard } = require('vk-io');

const white = Keyboard.SECONDARY_COLOR;
const green = Keyboard.POSITIVE_COLOR;
const red = Keyboard.NEGATIVE_COLOR;
const blue = Keyboard.PRIMARY_COLOR;

const goQuestion = Keyboard.builder().inline()
	.textButton({
		label: 'Начать викторину',
		payload: {
			command: `questions`,
		},
		color: green
	});

const memeButton = Keyboard.builder().inline()
	.textButton({
		label: 'Мем',
		payload: {
			command: `meme`,
		},
		color: white
	});

const statsButton = Keyboard.builder().inline()
	.textButton({
		label: '📈 Статистика',
		payload: {
			command: `getStats`,
		},
		color: green
	})
	.textButton({
		label: 'Мем',
		payload: {
			command: `meme`,
		},
		color: white
	});

const Answers = (value) => Keyboard.builder().inline()
	.textButton({
		label: 'Да',
		payload: {
			command: `yes-${value}`,
		},
		color: green
	})
	.textButton({
		label: 'Нет',
		payload: {
			command: `no-${value}`,
		},
		color: red
	});

const voteKeyboard = (meme) => Keyboard.builder().oneTime()
	.textButton({
		label: '👍🏻',
		payload: {
			command: `like-${meme}`,
		},
		color: green
	})
	.textButton({
		label: '👎🏻',
		payload: {
			command: `dislike-${meme}`,
		},
		color: red
	});

module.exports = { Answers, goQuestion, memeButton, voteKeyboard, statsButton }