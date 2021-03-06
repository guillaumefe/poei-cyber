
let botui = new BotUI('my-botui-app');
const recorded_answer = []

let score = 0
const updateScore = function(val) {
    score_box = document.getElementById('score')
    score = score + val
    score_box.innerHTML = score
}

const target_url = ()=>{
    return document.getElementById('target_url').value || "it's empty"
}

const record_answer = function (e) {
    if(e.target.checked) {
        recorded_answer.push(e.target.value)
    } else {
        const index = recorded_answer.indexOf(e.target.value)
        if (index > -1) {
            recorded_answer.splice(index, 1);
        }
    }
}

const get_data = () => {

    botui.message.add({
        content: "Que souhaitez-vous apprendre aujourd'hui?"
    })

    fetch(target_url(), { method:"GET"} )
        .then(function(response) {
            return response.text()
        })
        .then(function(text) {
            const questions = {}
            const topics = []
            const data = text.split('\n')
            const regex_c = /^[cC]atégorie/g;
            const regex_q = /^[qQ]uestion/g;
            let current_category = "default"
            questions[current_category] = []
            let current_question = ""
            for (let i in data) {
                if (data[i].match(regex_c)) {
                    current_category = data[i]
                    questions[current_category] = []
                }
                else if (data[i].match(regex_q)) {
                    current_question = {
                        question: '<strong>'+data[i]+'</strong>',
                        reponse: ""
                    }
                    questions[current_category].push(current_question)
                } else {
                    current_question.reponse += data[i]
                }
            }
            for (let i in questions) {
                topics.push({
                    text: i,
                    value: i
                })
            }

            start(topics, questions)
            //return [topics, questions]
        })
        .catch( (e) => {
            console.log(e)
        })

}

get_data()

document.getElementById("get").addEventListener("click", function(event) {

    const parent = document.getElementById('my-botui-app').parentNode 
    const child = document.getElementById('my-botui-app')
    parent.removeChild(child)
    const new_child = document.createElement('div')
    const new_bot = document.createElement('bot-ui')
    new_child.id = 'my-botui-app'
    parent.appendChild(new_child)
    new_child.appendChild(new_bot)
    botui = new BotUI('my-botui-app');
    get_data()

    //.then((data)=>{
    //    const topics = data[0]
    //    const questions = data[1]
    //    start(topics, questions)
    //}).catch((e)=>{
    //    console.log(e)
    //})


});


function start(topics, questions) {

    //let them = ""
    let bag = []
    const bag_factor = function(key) {
        bag = []
        for (let i in questions[key]) {
            try {
                bag.push(questions[key][i].reponse)
            } catch(e) {}
        }
        return bag
    }
    const ask = (them, num)=>questions[them][num].question
    const answer = (them, num)=>questions[them][num].reponse.split('\n')

    //botui.action.button({
    //    action: topics
    //}).then(() => {
        botui.action.button({
            action: topics
        }).then(function (res) { // will be called when a button is clicked.
            const theme = res.value
            botui.message.add({
                content: "ok je cherche"
            });
            const brain = function() {
                const question_bag = bag_factor(theme)
                const rand = Math.floor(Math.random() * questions[theme].length -1) + 1  
                const q = ask(res.value, rand)
                const r = answer(res.value, rand)
                const trashed = []
                botui.message.add({
                    type: 'html',
                    delay: 1500,
                    content: q
                }).then(()=>{
                    const t1 = Math.floor(Math.random() * question_bag.length - 1) + 1
                    const t2 = Math.floor(Math.random() * question_bag.length - 1) + 1
                    const sec = 100
                    while (question_bag[t1] === r && sec > 0) {
                        t1 = Math.floor(Math.random() * question_bag.length - 1) + 1
                        sec = sec - 1
                    }
                    while (question_bag[t2] === r && sec > 0) {
                        t2 = Math.floor(Math.random() * question_bag.length - 1) + 1
                        sec = sec - 1
                    }
                    if (t1 !== r && t1 !== t2) {
                        trashed.push({
                            text: '<input onclick="record_answer(event)" value="'+question_bag[t1]+'" type="checkbox">' + question_bag[t1] + '</input>',
                            value: question_bag[t1],
                        })
                    }
                    if (t2 !== r) {
                        trashed.push({
                            text: '<input onclick="record_answer(event)" value="'+question_bag[t2]+'" type="checkbox">' + question_bag[t2] + '</input>',
                            value: question_bag[t2],
                        })
                    }
                    const index = Math.floor(Math.random() * 3) + 1
                    trashed.splice(index - 1, 0, {
                        text: '<input onclick="record_answer(event)" value="'+r+'" type="checkbox"></input> ' + r + '</input>',
                        value: '<input type="checkbox"></input> ' + r
                    });

                    for (let t in trashed) {
                        botui.message.add({
                            type: 'html',
                            content: trashed[t].text
                        }).then(()=>{
                        });
                    }

                    botui.action.button({
                        action: [{text:"submit", value:"submit"}]
                    }).then(function (res) { // will be called when a button is clicked.
                        const isEqual = function (a, b) {
                            if(a.length!=b.length) {
                                return false;
                            } else {
                                for(let i=0;i<a.length;i++) {
                                    if(a[i]!=b[i]) {
                                        return false;
                                    }
                                    return true;
                                }
                            }
                        }

                        //console.log(recorded_answer.sort(), r.sort())
                        if (isEqual(recorded_answer.sort(), r.sort())) {
                            botui.message.add({
                                content: 'well done!'
                            }).then(()=>{
                                for (let i in recorded_answer) {
                                    recorded_answer.pop()
                                }
                                updateScore(1)
                                brain()
                            });
                        } else {
                            botui.message.add({
                                content: 'nope.'
                            }).then(()=>{
                                for (let i in recorded_answer) {
                                    recorded_answer.pop()
                                }
                                updateScore(-1)
                                brain()
                            });
                        }

                    });
                })
            }
            brain()
        })
    //})
}
