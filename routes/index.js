var express = require('express');
var router = express.Router();

const { MongoClient  } = require('mongodb');
const { ObjectId } = require('mongodb');
const cron = require('node-cron');


// Connection URL
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'todoapp';

async function main(data) {
  try {
    await client.connect();
    //console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('user');

    // Insert the data into the collection
    const result = await collection.insertOne(data);
    //console.log(`Inserted document with _id: ${result.insertedId}`);


    return 'done.';
  } catch (error) {
    console.error(error);
  } finally {
    client.close();
  }
}

/* add operation in database */
async function addtasks(data) {
  try {
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection('tasks');

    // Insert the data into the collection
    const result = await collection.insertOne(data);
    

    return 'done.';
  } catch (error) {
    console.error(error);
  } finally {
    client.close();
  }
}

/* searching operation in database */
async function loginfind(data) {
  try {
    console.log(data)
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('user');

    const filteredDocs = await collection.find({ email: data.email }).toArray();
    filteredDocs.forEach(doc => {
      console.log(doc.pw)
      if (data.pw == doc.pw) {
        count = 1;

      } else {
        count = 0;
      }
      return count;
    });


    return count;
  } catch (error) {
    console.error(error);
  } finally {
    client.close();
  }
}

/* list operation in database */
async function getDataFromMongoDB() {
  try {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('tasks');

    // Fetch data from the collection
    const data = await collection.find({}).toArray();

    client.close();

    return data;
  } catch (error) {
    console.error('Error fetching data from MongoDB:', error);
    throw error;
  }
}




/* delete operation in database */
async function deleteTaskFromMongoDB(taskId) {
  try {
    //console.log(taskId);
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('tasks');

    // Convert the taskId to an ObjectID
    const objectId = new ObjectId(taskId);

    // Perform the delete operation
    const result = await collection.deleteOne({ _id: objectId });

  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    client.close();
  }
}




/* GET index page. */
router.get('/', function (req, res, next) {
 
  res.render('index', { title: 'Express',});
});
/* GET home page. */
router.get('/home',async function (req, res, next) {
  const taskss = await getDataFromMongoDB();
 
  res.render('home',{ taskss });
});
/* GET signup page. */
router.post('/signup', function (req, res, next) {
  res.render('signup');
});

router.get('/calender', async function (req, res, next) {
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const remindersCollection = db.collection('reminders');

    // Fetch all reminder tasks from the collection
    const reminderTasks = await remindersCollection.find({}).toArray();
    console.log(reminderTasks);
    res.render('calender', { reminderTasks });
  } catch (error) {
    console.error('Error fetching reminder tasks:', error);
    res.sendStatus(500);
  } finally {
    client.close();
  }
});


/* home page validation. */
router.post('/home', async function (req, res) {
  
  const result = await loginfind(req.body);
  const taskss = await getDataFromMongoDB();
  
  if (count == 1) {
    res.render('home',{ taskss });
  } else {
    res.sendStatus(500);
  }


});

router.post('/addtask', async function (req, res) {
  const task = await addtasks(req.body);
  
  
  res.redirect('home')
  
  
});

router.post('/addreminder', async function (req, res) {
 
  try {
    await client.connect();
    const db = client.db(dbName);
    
    const reminderTask = req.body.task;
    const reminderDate = req.body.reminderdate;
    const phonenumber = req.body.phonenumber;
    console.log(reminderTask);
    console.log(reminderDate);
    console.log(phonenumber);
    
    
    const remindersCollection = db.collection('reminders');
    const result = await remindersCollection.insertOne({
      reminderTask,
      reminderDateTime: new Date(reminderDate), // Convert string to Date
      phonenumber,
    });
    res.redirect('/calender');
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  
  
});




// ... (previous imports and setup)

// ...

// Define a function to send reminders
async function sendReminders() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const remindersCollection = db.collection('reminders');

const currentDateTime = new Date();
const nextMinute = new Date(currentDateTime.getTime() + 60000); // Add 1 minute to current time

const pendingReminders = await remindersCollection.find({
  reminderDateTime: {
    $gte: currentDateTime, // Find reminders with reminderDateTime greater than or equal to current time
    $lt: nextMinute,       // Find reminders with reminderDateTime less than next minute
  },
}).toArray();

    console.log(pendingReminders);

    for (const reminder of pendingReminders) {
      // Perform the action to send the reminder (e.g., send a WhatsApp message)
      const recipientPhoneNumber = reminder.phonenumber; // Replace with your recipient's phone number
      const reminderTask = reminder.reminderTask;

      // Send a WhatsApp message
      sendWhatsAppMessage(recipientPhoneNumber, `Reminder: ${reminderTask}`);
      
      // Update the reminder status to mark it as sent
      await remindersCollection.updateOne(
        { _id: reminder._id },
        { $set: { reminderStatus: 'sent' } }
      );
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  } finally {
    client.close();
  }
}

async function sendWhatsAppMessage(to, body) {
  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body,
      from: `whatsapp:${twilioPhoneNumber}`,
      to: `whatsapp:${to}`
    });

    console.log('WhatsApp message sent with SID:', message.sid);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}


// Schedule the sendReminders function to run every minute (adjust as needed)
cron.schedule('* * * * *', sendReminders);

// ...







router.post('/deletetask',async function (req, res, next) {
  
  const taskid = req.body.taskId;
  //console.log(taskid);
  await deleteTaskFromMongoDB(taskid);
  res.redirect('home')
});




async function updateTaskInMongoDB(taskId, newTask, newStatus) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('tasks');

    // Convert the taskId to an ObjectID
    const objectId = new ObjectId(taskId);

    // Perform the update operation
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { task:newStatus } }
    );

    return 'done.';
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    client.close();
  }
}



router.post('/updatetask', async function (req, res, next) {
  const taskId = req.body.taskId;
  const newTask = req.body.newTask;
  const newStatus = req.body.newStatus;

  await updateTaskInMongoDB(taskId, newTask, newStatus);
  res.json({ success: true });
});












router.post('/submit', async function (req, res) {
  try {
    const result = await main(req.body);

    res.render('home');
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }

});




const twilio = require('twilio');

const accountSid = 'ACf8358ee7a09823cf5a2a4f79ecc33fd5';  // Replace with your Twilio Account SID
const authToken = 'e5b4149bce702549f30ce721e47056e8';    // Replace with your Twilio Auth Token
const twilioPhoneNumber = '+14155238886'; // Replace with your Twilio phone number







module.exports = router;
