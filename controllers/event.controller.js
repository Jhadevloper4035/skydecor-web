const Event = require('../models/event.model');

exports.getEvents = async (req, res) => {
  try {
    // Use the compound index (date: -1, slug: 1) for optimized sorting
    // Select only needed fields to reduce data transfer
    const events = await Event.find()
      .select('title slug date coverImage createdAt')
      .sort({ date: -1 })
      .lean()
      .exec();

    res.render('event', {
      title: 'Events Page',
      message: 'Welcome to our Events!',
      events,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load events. Please try again later.'
    });
  }
};

exports.getSingleEvent = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).render('error', { 
        title: 'Error', 
        message: 'Invalid request: slug is required' 
      });
    }

    // Use the optimized findBySlug static method from the model
    const event = await Event.findBySlug(slug);

    if (!event) {
      return res.status(404).render('error', {
        title: 'Event Not Found',
        message: 'The event you are looking for does not exist.'
      });
    }

    res.render('single-event', {
      title: event.title,
      message: `Event Details: ${event.title}`,
      event,
    });
  } catch (error) {
    console.error('Error fetching single event:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load event details. Please try again later.'
    });
  }
};

// Bonus: Get upcoming events only
exports.getUpcomingEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Use the optimized static method from model
    const events = await Event.findUpcoming(limit);

    res.render('event', {
      title: 'Upcoming Events',
      message: 'Check out our upcoming events!',
      events,
    });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load upcoming events. Please try again later.'
    });
  }
};

// Bonus: Get events by date range
exports.getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).render('error', {
        title: 'Error',
        message: 'Start date and end date are required'
      });
    }

    const events = await Event.findByDateRange(
      new Date(startDate),
      new Date(endDate)
    );

    res.render('event', {
      title: 'Events',
      message: `Events from ${startDate} to ${endDate}`,
      events,
    });
  } catch (error) {
    console.error('Error fetching events by date range:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load events. Please try again later.'
    });
  }
};