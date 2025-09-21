const Event = require('../models/event.model'); // Your Mongoose Event schema


exports.getEvents = async (req, res) => {
  try {
    // Fetch all events from MongoDB, sorted by date descending
    const events = await Event.find().sort({ date: -1 });

    // Render your EJS page and pass events
    res.render('event', {
      title: 'Events Page',
      message: 'Welcome to our Events!',
      events, // send all events to EJS
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


exports.getSingleEvent = async (req, res) => {
  try {


    const { slug } = req.params;


    if (!slug) {
      return res.status(400).render("error", { 
        title: "Error", 
        message: "Invalid request: slug is mandatory" 
      });
    }

    const event = await Event.findOne({slug})

    // Render your EJS page and pass events
    res.render('single-event', {
      title: 'Events Page',
      message: 'Welcome to our Events!',
      event, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};
