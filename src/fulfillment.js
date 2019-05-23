// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

// DB connection
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'ws://myscribe-7d6a0.firebaseio.com/',
});
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  function markForReview(agent) {
    // TODO: Question count check
    const questionNumber = agent.parameters.number;
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    console.log("In markForReview, rollNumber " + rollNumber + ", question number " + questionNumber);
    agent.add('Added question ' + questionNumber + ' for review.');
    return admin.database().ref('users/' + rollNumber + '/answer' + questionNumber).update({
      toBeReviewed: 'yes',
    });
  }
  
  function NthReviewQuestion(agent) {
    const reviewNumber = agent.parameters.number;
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    console.log("In NthReviewQuestion, rollNumber " + rollNumber + ", review number " + reviewNumber);
    return admin.database().ref('users/' + rollNumber).once("value").then((snapshot) => {
        const answers = snapshot.val();
        let reviewList = [];
        for (let answer in answers) {
          if (answers[answer].toBeReviewed === 'yes') {
            reviewList.push(parseInt(answer.substring(6)));
          }
        }
        if (reviewNumber > reviewList.length) {
          if (reviewList.length === 0) {
            agent.add('There are no questions in review list.');
          } else {
            agent.add('There are only ' + reviewList.length + ' questions added for review');
          }
        } else {
          reviewList.sort();
          agent.add('The question you asked for is  ');
          return admin.database().ref('question' + reviewList[reviewNumber - 1]).once("value").then((snapshot) => {
            agent.add(snapshot.child('text').val());
          });
        }
    });
  }
  
  function NthUnattemptedQuestion(agent) {
    let questionNumber = agent.parameters.number;
    if (questionNumber > 1000) {
      agent.add('Not enough questions in the exam.');
      return;
    }
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    console.log("In NthUnattemptedQuestion, rollNumber " + rollNumber + ", question number " + questionNumber);
    return admin.database().ref('users/' + rollNumber).once("value").then((snapshot) => {
        const answers = snapshot.val();
        let answeredList = [];
        for (let answer in answers) {
          const answerText = answers[answer].text;
          if (answerText !== null && answerText !== undefined && answerText.length > 0) {
            answeredList.push(parseInt(answer.substring(6)));
          }
        }
        answeredList.sort();
        let idx = 0;
        let nthUnanswered = -1;
        for (let i = 1;;i++) {
          if (idx < answeredList.length && answeredList[idx] == i) {
            idx++;
          } else {
            questionNumber--;
            if (questionNumber === 0) {
              nthUnanswered = i;
              break;
            }
          }
        }
        return admin.database().ref('question' + nthUnanswered).once("value").then((snapshot) => {
            const question = snapshot.child('text').val();
            if (question === null || question.length === 0) {
              agent.add('There are not enough questions in this paper.');
            } else {
              agent.add('The question you asked for is  ');
              agent.add(question);
            }
        });
    });
  }
  
  function questionsCount(agent) {
    return admin.database().ref('totalQuestions').once("value").then((snapshot) => {
        const totalQuestions = snapshot.val();  
        agent.add('There are '+ totalQuestions + ' questions in this paper.');
    });
  }
  
  function readQuestion(agent) {
    console.log(agent.parameters);
    const questionNumber = agent.parameters.number;
    return admin.database().ref('totalQuestions').once("value").then((snapshot) => {
        const totalQuestions = snapshot.val();
        console.log(totalQuestions);
        if(questionNumber > totalQuestions){
            console.log(questionNumber + ' ' + totalQuestions);
            agent.add('There are only '+ totalQuestions + ' questions in this paper.');
        } else {
            console.log(questionNumber);
            return admin.database().ref('question' + questionNumber).once("value").then((snapshot) => {
              agent.add(snapshot.child('text').val());
            });
        }
    });
  }
  
  function readAnswer(agent) {
    const answerNumber = agent.parameters.number;
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    console.log("Answer number: " + answerNumber);
    return admin.database().ref('totalQuestions').once("value").then((snapshot) => {
      const totalQuestions = snapshot.val();
      console.log("total questions: " + totalQuestions + " " + answerNumber);
      return admin.database().ref('users/' + rollNumber + "/answer" + answerNumber).once("value").then((snapshot2) => {
        const answer = snapshot2.child('text').val();
        if(answer === null || answer.length === 0){
            agent.add('The answer for question '+ answerNumber + ' has not yet been provided by you.');
        } else {
            agent.add(answer);
        }
      });
    });
  }
  
  function readInstruction(agent) {
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    console.log(rollNumber);
    return admin.database().ref('totalQuestions').once("value").then((snapshot) => {
        const totalEntries = snapshot.val();
        agent.add('Total time of the examination is 1 hour. ' +
        'The question paper consists of '+ totalEntries +' questions, each having 2 marks.');
    });
  }
  
  function removeFromReviewList(agent) {
    const questionNumber = agent.parameters.number;
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    agent.add('Question ' + questionNumber + ' removed from review list.');
    return admin.database().ref('users/' + rollNumber + "/answer" + questionNumber).update({
      toBeReviewed: 'no',
    });
  }
  
  function reviewQuestionsCount(agent) {
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    console.log("In reviewQuestionsCount, rollNumber " + rollNumber);
    return admin.database().ref('users/' + rollNumber).once("value").then((snapshot) => {
        const answers = snapshot.val();
        let reviewList = [];
        for (let answer in answers) {
          if (answers[answer].toBeReviewed === 'yes') {
            reviewList.push(parseInt(answer.substring(6)));
          }
        }
        agent.add('There are ' + reviewList.length + ' questions in review list.');
    });
  }
  
  function submitAnswer(agent) {
    const questionNumber = agent.parameters.number;
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    const answer = agent.parameters.text;
    console.log(questionNumber + ": " + answer);
    if (answer.length > 0) {
      agent.add('Great, your answer for question ' + questionNumber + ' is recorded.');
      return admin.database().ref('users/' + rollNumber + "/answer" + questionNumber).update({
        text: answer,
      });
    }
  }
  
  function unattemptedQuestionsCount(agent) {
    const rollNumber = agent.getContext('roll_number').parameters.roll;
    console.log("In unattemptedQuestionsCount, rollNumber " + rollNumber);
    return admin.database().ref('users/' + rollNumber).once("value").then((snapshot) => {
        const answers = snapshot.val();
        let answeredList = [];
        for (let answer in answers) {
          const answerText = answers[answer].text;
          if (answerText !== null && answerText !== undefined && answerText.length > 0) {
            answeredList.push(parseInt(answer.substring(6)));
          }
        }
        return admin.database().ref('totalQuestions').once("value").then((snapshot) => {
          const totalEntries = snapshot.val();
          const remainingQuestions = totalEntries - answeredList.length;
          if (remainingQuestions === 0) {
            agent.add('All questions are answered.');
          } else {
            agent.add(remainingQuestions + ' questions remaining to be answered.');
          }
        });
    });
  }
  
  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('markForReview', markForReview);
  intentMap.set('NthReviewQuestion', NthReviewQuestion);
  intentMap.set('NthUnattemptedQuestion', NthUnattemptedQuestion);
  intentMap.set('questionsCount', questionsCount);
  intentMap.set('readAnswer', readAnswer);
  intentMap.set('readInstruction', readInstruction);
  intentMap.set('readQuestion', readQuestion);
  intentMap.set('removeFromReviewList', removeFromReviewList);
  intentMap.set('reviewQuestionsCount', reviewQuestionsCount);
  intentMap.set('submitAnswer', submitAnswer);
  intentMap.set('unattemptedQuestionsCount', unattemptedQuestionsCount);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
