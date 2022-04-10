const { VK } = require('vk-io')
const fs = require('fs')

const settings = require('./data/settings.json')
const memes = require('./data/memes.json')
const users = require('./data/users.json')
const stats = require('./data/stats.json')

const { Answers, goQuestion, memeButton, voteKeyboard, statsButton } = require('./data/keyboards')

const token = settings.vkToken

const memesInput = './data/memes' // Папка с мемами 

const vk = new VK({
    token
})

// Вопросы викторины

const questions = [
    'ВКонтакте пользуются более 50 млн человек в день',
    'Большинство пользователей ВКонтакте из России',
    'В Поддержке ВКонтакте работает менее 1000 человек',
    'ВКонтакте находится в ТОП-3 популярных сайтов РФ',
    'Домен vk.com был зарегистрирован в 2012 году',
    'Более 70% жителей России регулярно заходят во ВКонтакте',
    'Суббота - день, когда аудитория ВКонтакте наиболее активна',
    'Пользователи чаще заходят во ВКонтакте с мобильных устройств'
]

// Правильные ответы на вопросы соответственно по порядку

const correctAnswers = [
    true,
    true,
    false,
    true,
    false,
    true,
    false,
    true
]

function sendReplyToAnswer(type, value, context) {
    const nextQuestion = questions[value+1]

    context.reply(`${type ? 'Правильно!' : 'Не верно!'}\n\n${value < questions.length - 1 ? `Следующий вопрос:\n${nextQuestion}` : 'На этом викторина окончена! Чтобы посмотреть мемы, отправьте команду "Мем"' }`,{
        keyboard: value < questions.length - 1 ? Answers(value+1) : memeButton
    })
}

function saveMemesBase() {
    fs.writeFileSync('./data/memes.json', JSON.stringify(memes, null, "\t"))
}

function saveUsersBase() {
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, "\t"))
}

function saveStatsBase() {
    fs.writeFileSync('./data/stats.json', JSON.stringify(stats, null, "\t"))
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
fs.readdir(memesInput, (error, files) => {
    if(error) console.log(error)
    files.forEach(file => {
        const name = file.split('.')[0]

        if(!memes[name]) {
            memes[name] = {
                "like": [],
                "dislike": [],
                "url": null
            }
        }

    })
    saveMemesBase()
})

vk.updates.on('message_new', async (context) => {

    const user = context.senderId
    const payload = context.messagePayload?.command
    const action = payload?.split('-')
    const attachments = context?.attachments

    if(!users[user]) {
        users[user] = {
            "liked": 0,
            "disliked": 0,
            "views": 0
        }
    }
    
    saveUsersBase()

    if(attachments.length > 0) {
        if(attachments.length > 4) {
            return context.reply('Пожалуйста, прикрепляйте не более 4-х мемов за раз!')
        }
        attachments.forEach(object => {
            const url = object.largeSizeUrl
            const name = url
                .split('/')[5]
                .split('.jpg')[0]
                .replace(/[^a-zA-Z0-9]+/g, '')

            if(!memes[name]) {
                memes[name] = {
                    "like": [],
                    "dislike": [],
                    "url": url
                }
            }

        })
        saveMemesBase()
        return context.reply(`😁 Добавлено мемов: ${attachments.length}\nСпасибо!`)
    }

    const text = context.text.toLowerCase()

    if(text == 'привет' || text == 'начать') {
        context.reply('👋 Привет Вездекодерам', {
            keyboard: goQuestion
        })
    }

    if(text == 'мем') {
        let memesList = []

        // Получаем список мемов, которые не оценивал пользователь
        Object.entries(memes).forEach(object => {
            if(object[1].like.includes(user) || object[1].dislike.includes(user)) return;
            memesList.push(object[0])
        })

        if(memesList.length == 0) return context.reply('Вы оценили все доступные мемы!')

        const meme = memesList[getRandomNumber(0,memesList.length)]

        users[user].views++

        let url = memes[meme]?.url
        let path = ''

        if(url) {
            path = url
        } else {
            path = `./data/memes/${meme}.png`
        }

        context.sendPhotos({
            value: path
        }, {
            message: 'Оцените мем нажатием на одну из доступных кнопок ниже!',
            keyboard: voteKeyboard(meme)
        })

        saveUsersBase()
    }

    if(payload) {
        if(payload == 'questions') {
            context.reply(`Начнём викторину! Первый вопрос:\n\n${questions[0]}`,{
                keyboard: Answers(0)
            })
        }
        if(action[0] == 'yes') {
            const question = Number(action[1])

            if(correctAnswers[question]) {
                sendReplyToAnswer(true, question, context)
            } else {
                sendReplyToAnswer(false, question, context)
            }
        }
        if(action[0] == 'no') {
            const question = Number(action[1])

            if(!correctAnswers[question]) {
                sendReplyToAnswer(true, question, context)
            } else {
                sendReplyToAnswer(false, question, context)
            }
        }

        if(['like', 'dislike'].includes(action[0])) {

            const meme = action[1]
            const move = action[0]

            if(memes[meme].like.includes(user) || memes[meme].dislike.includes(user)) return context.reply('Вы уже оценивали этот мем!')

            memes[meme][move].push(user)
            context.reply(`Вы успешно поставили ${move} этому мему!`,{
                keyboard: statsButton
            })

            const userAction = `${move}d` // like = liked; dislike = disliked hahahhahahah
            users[user][userAction]++
            stats[userAction]++

            saveMemesBase()
            saveUsersBase()
            saveStatsBase()
        }

        if(action[0] == 'getStats') {
            const userData = users[user]

            context.reply(`Ваша статистика:\n\n👍🏻 | Лайков поставлено: ${userData.liked}\n👎🏻 | Дизлайков поставлено: ${userData.disliked}\n\n👁 | Мемов просмотрено: ${userData.views}\n\nВсего лайков: ${stats.liked}\nВсего дизлайков: ${stats.disliked}\n\n🏆 Рейтинг мемов по лайкам:\n(Загрузка может занять немного времени)`)

            const ratingItems = Object.keys(memes).sort((x, y) => memes[x].like.length - memes[y].like.length).reverse().slice(0,9)

            let rating = []
            let ratingText = ''
            ratingItems.forEach((object, index) => {

                let url = memes[object]?.url
                let path = ''

                if(url) {
                    path = url
                } else {
                    path = `./data/memes/${object}.png`
                }

                rating.push({ value: path })
                ratingText += `${index+1} место | Лайков: ${memes[object].like.length}\n`
            })
            context.sendPhotos(rating, {
                message: ratingText,
            })

        }
    }

})

vk.updates.start().then(console.log('INFO | Бот запущен'))