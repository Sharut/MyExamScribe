# MyExamScribe

MyExamScribe is an effort to address and combat issues related to availability of reliable scribes for visually impaired and handicapped people during examinations. 

This application, built on top of Google assistant, is capable of interacting with the user by reading instructions and questions, storing answers, marking questions for review, etc. Its reliability and ease of usability can make it a possible replacement for human scribes.

## Technologies

![](/screenshots/flow.png)

* **Dialogflow aka api.ai (Google assistant)** 

NLP based machine learning model to train different user intents (read question, write answer etc).

![](/screenshots/Dialogflow.png)

* **Firebase cloud database**

NoSQL database to store question paper and candidate's responses.

![](/screenshots/Database.png)

* **Node.js Server** 

Webhook (HTTP endpoint) to serve intents and fetch/mutate data from database.

![](/screenshots/code.png)

## Functionality 

The following sub-section summarizes all the features supported by the application. Note that **all the phrases corresponding to the same meaning are mapped to the same action as we are using a machine learing model.** Appropriate error messages are generated when an invalid command is fed into the application. This feature makes the product very easy to use.

### Sign Up

User needs to provide their unique roll number to proceed.

Phrases like "12", "My roll number is 14", "Roll number 13", etc. can be used. 

### Reading Instructions

User can command the application to read instructions before starting the exam

Phrases like "Please read the instructions", "what are the instructions", "Read instructions", etc. can be used.

### Reading Questions

User can command the application to read questions by providing the specific question number. Error messages are returned if a specific question number is not provided or if the number provided exceeds the total questions in the examination.

Phrases like "Please read the first question", "what is question 2", "question five", etc. can be used.

### Submitting answers

User can command the application to record answers. First the user needs to specify the question number for which the answer needs to be recorded. This is followed by the answer text itself.

Phrases like "I wish to answer question 2", "I want to answer the first question" etc. following the answer text can be used.

### Marking questions for review

User can command the application to flag a certain question for reviewing later by providing the question number.

Phrases like "Please add question 1 to review list", "Flag question 4 for review", "mark third question for review", etc. can be used.

### Reading the Nth question on review list

User can command the application to read the questions that have been added to the review list in serial order of occurence.

Phrases like "Read the first question on the review list", "what is question two on review list", etc. can be used.

### Removing questions from review list

Once sure of the answer, the user can command the application to remove the question from the review list by providing the question number.

Phrases like "Remove the first question from review list", "remove question 2 from review list", etc. can be used.

### Reading the Nth unanswered question

User can command the application to read the questions for which the answer fields are empty in serial order of occurence.

Phrases like "Read the first question on the review list", "what is question two on review list", etc. can be used.

### Reading an answer

In order to verify the answers before submission, user can command the application to read out the recorded answer by providing the corresponding question number.

Phrases like "Please read the first question", "what is question 1", "question one", etc. can be used.
