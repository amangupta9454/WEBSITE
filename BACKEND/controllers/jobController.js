const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const axios = require('axios');

// Get all jobs with filtering and pagination
exports.getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 12, role, location, remote, minSalary, admin } = req.query;
    
    // Build query
    const query = {};
    if (admin !== 'true') {
      query.isActive = true;
    }
    
    if (role) {
      query.title = { $regex: role, $options: 'i' };
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (remote === 'true') {
      query.isRemote = true;
    }
    
    // Simple mock for salary filter, in reality needs parsing
    if (minSalary) {
      // Assuming minimum salary filter is complex string parsing, 
      // skipping exact implementation for now.
    }

    const jobs = await Job.find(query)
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Job.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching jobs' });
  }
};

// Get a single job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    res.status(500).json({ success: false, message: 'Server error fetching job details' });
  }
};

// Save a job for a user
exports.saveJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const userId = req.user.id; // Assuming authMiddleware sets req.user

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const existingSave = await SavedJob.findOne({ user: userId, job: jobId });
    if (existingSave) {
      return res.status(400).json({ success: false, message: 'Job already saved' });
    }

    await SavedJob.create({ user: userId, job: jobId });

    res.status(200).json({ success: true, message: 'Job saved successfully' });
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({ success: false, message: 'Server error saving job' });
  }
};

// Unsave a job for a user
exports.unsaveJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const userId = req.user.id;

    const deleted = await SavedJob.findOneAndDelete({ user: userId, job: jobId });
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Saved job not found' });
    }

    res.status(200).json({ success: true, message: 'Job removed from saved list' });
  } catch (error) {
    console.error('Error unsaving job:', error);
    res.status(500).json({ success: false, message: 'Server error unsaving job' });
  }
};

// Get all saved jobs for a user
exports.getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const savedJobs = await SavedJob.find({ user: userId })
      .populate('job')
      .sort({ savedAt: -1 });
      
    // Filter out any where the job was deleted
    const validSavedJobs = savedJobs.filter(sj => sj.job != null).map(sj => ({
      _id: sj._id,
      savedAt: sj.savedAt,
      job: sj.job
    }));

    res.status(200).json({
      success: true,
      data: validSavedJobs
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching saved jobs' });
  }
};

// Function to sync jobs from RapidAPI (Active Jobs DB & JSearch)
// This will be called by cron and can also be triggered manually
exports.syncJobsFromAPI = async () => {
  let activeJobsAdded = 0;
  let jsearchAdded = 0;
  let prLabsAdded = 0;
  let patrickAdded = 0;
  
  try {
    console.log('Starting job sync from Active Jobs DB...');
    
    const activeJobsOptions = {
      method: 'GET',
      url: 'https://active-jobs-db.p.rapidapi.com/active-ats',
      params: { 
        time_frame: '24h',
        limit: '30',
        offset: '0',
        description_format: 'text',
        title: '"Software Engineer" OR "Developer" OR "Frontend" OR "Backend"',
        location: '"India" OR "Remote"'
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'active-jobs-db.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await axios.request(activeJobsOptions);
      
      let apiJobs = [];
      if (Array.isArray(response.data)) {
        apiJobs = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        apiJobs = response.data.data;
      }
      
      for (const apiJob of apiJobs) {
        const jobId = apiJob.id || apiJob.job_id || String(Math.random());
        const title = apiJob.title || apiJob.job_title || 'Software Professional';
        const company = apiJob.company_name || apiJob.employer_name || 'Tech Company';
        
        let location = 'Remote';
        if (apiJob.locations_derived && Array.isArray(apiJob.locations_derived) && apiJob.locations_derived.length > 0) {
          location = apiJob.locations_derived[0];
        } else if (apiJob.location) {
          location = apiJob.location;
        }
        
        const applyUrl = apiJob.url || apiJob.apply_link || '#';
        const description = apiJob.description_text || apiJob.description || '';
        const isRemote = location.toLowerCase().includes('remote') || apiJob.ai_remote_location != null || apiJob.ai_work_arrangement === 'Remote';

        const result = await Job.updateOne(
          { externalId: jobId },
          {
            $set: {
              title, company, location, isRemote, applyUrl, description,
              source: 'ActiveJobsDB', fetchedAt: new Date(), isActive: true
            }
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) activeJobsAdded++;
      }
      console.log(`Active Jobs DB sync complete. Added ${activeJobsAdded} new jobs.`);
    } catch (err) {
      console.error('Active Jobs DB Error:', err.response ? err.response.data : err.message);
    }

    // --- JSEARCH INTEGRATION ---
    console.log('Starting job sync from JSearch...');
    const jsearchOptions = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: 'software developer in India',
        page: '1',
        num_pages: '1',
        date_posted: 'today'
      },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(jsearchOptions);
      const jsearchJobs = response.data?.data || [];
      
      for (const apiJob of jsearchJobs) {
        const jobId = apiJob.job_id || String(Math.random());
        const title = apiJob.job_title || 'Software Developer';
        const company = apiJob.employer_name || 'Unknown Company';
        const location = apiJob.job_city ? `${apiJob.job_city}, ${apiJob.job_country}` : 'Remote';
        const applyUrl = apiJob.job_apply_link || '#';
        const description = apiJob.job_description || '';
        const isRemote = apiJob.job_is_remote === true || location.toLowerCase().includes('remote');

        const result = await Job.updateOne(
          { externalId: jobId },
          {
            $set: {
              title, company, location, isRemote, applyUrl, description,
              source: 'JSearch', fetchedAt: new Date(), isActive: true
            }
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) jsearchAdded++;
      }
      console.log(`JSearch sync complete. Added ${jsearchAdded} new jobs.`);
    } catch (err) {
      console.error('JSearch Error:', err.response ? err.response.data : err.message);
    }

    // --- PR LABS JOBS SEARCH API INTEGRATION ---
    console.log('Starting job sync from PR Labs JOBS SEARCH API...');
    const prLabsOptions = {
      method: 'POST',
      url: 'https://jobs-search-api.p.rapidapi.com/getjobs',
      data: {
        search_term: 'Software Developer',
        location: 'India',
        results_wanted: 15,
        site_name: ['linkedin', 'indeed', 'zip_recruiter', 'glassdoor'],
        job_type: 'fulltime',
        is_remote: false
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'jobs-search-api.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await axios.request(prLabsOptions);
      const prLabsJobs = response.data?.jobs || response.data || [];
      
      for (const apiJob of prLabsJobs) {
        if (!apiJob) continue;
        const jobId = apiJob.id || apiJob.job_id || String(Math.random());
        const title = apiJob.title || apiJob.job_title || 'Software Developer';
        const company = apiJob.company || apiJob.company_name || 'Tech Company';
        const location = apiJob.location || 'India';
        const applyUrl = apiJob.url || apiJob.job_url || '#';
        const description = apiJob.description || '';
        const isRemote = location.toLowerCase().includes('remote') || apiJob.is_remote === true;

        const result = await Job.updateOne(
          { externalId: jobId },
          {
            $set: {
              title, company, location, isRemote, applyUrl, description,
              source: 'PRLabs', fetchedAt: new Date(), isActive: true
            }
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) prLabsAdded++;
      }
      console.log(`PR Labs sync complete. Added ${prLabsAdded} new jobs.`);
    } catch (err) {
      console.error('PR Labs Error:', err.response ? err.response.data : err.message);
    }

    // --- PATRICK JOBS API INTEGRATION ---
    // Note: The endpoint url needs to be verified from RapidAPI dashboard
    console.log('Starting job sync from Patrick Jobs API...');
    const patrickOptions = {
      method: 'GET',
      // Update this URL with the correct one from the "Get Jobs" snippet in your RapidAPI dashboard
      url: 'https://jobs-api14.p.rapidapi.com/v2/list', 
      params: {
        query: 'Software Developer',
        location: 'India'
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'jobs-api14.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(patrickOptions);
      const patrickJobs = response.data?.jobs || response.data?.data || [];
      
      for (const apiJob of patrickJobs) {
        if (!apiJob) continue;
        const jobId = apiJob.id || apiJob.jobId || String(Math.random());
        const title = apiJob.title || 'Software Developer';
        const company = apiJob.company || 'Tech Company';
        const location = apiJob.location || 'India';
        const applyUrl = apiJob.url || apiJob.jobProviders?.[0]?.url || '#';
        const description = apiJob.description || '';
        const isRemote = location.toLowerCase().includes('remote');

        const result = await Job.updateOne(
          { externalId: jobId },
          {
            $set: {
              title, company, location, isRemote, applyUrl, description,
              source: 'PatrickJobsAPI', fetchedAt: new Date(), isActive: true
            }
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) patrickAdded++;
      }
      console.log(`Patrick Jobs API sync complete. Added ${patrickAdded} new jobs.`);
    } catch (err) {
      console.error('Patrick Jobs API Error:', err.response ? err.response.data : err.message);
    }

    const totalNewJobs = activeJobsAdded + jsearchAdded + prLabsAdded + patrickAdded;
    console.log(`Total Job sync complete. Added ${totalNewJobs} new jobs.`);
    return { success: true, count: totalNewJobs, sources: { activeJobsAdded, jsearchAdded, prLabsAdded, patrickAdded } };
  } catch (error) {
    console.error('Error in job sync process:', error.message);
    return { success: false, error: error.message };
  }
};

// Manual sync endpoint for admin
exports.manualSync = async (req, res) => {
  try {
    const result = await exports.syncJobsFromAPI();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sync failed' });
  }
};
// Admin endpoint to toggle a job's status
exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    job.isActive = !job.isActive;
    await job.save();
    
    res.status(200).json({ success: true, message: `Job ${job.isActive ? 'activated' : 'deactivated'} successfully`, job });
  } catch (error) {
    console.error('Error toggling job status:', error);
    res.status(500).json({ success: false, message: 'Server error toggling job status' });
  }
};

// Admin endpoint to edit a job
exports.editJob = async (req, res) => {
  try {
    const { title, company, location, isRemote, salary, applyUrl, description } = req.body;
    
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { title, company, location, isRemote, salary, applyUrl, description },
      { new: true, runValidators: true }
    );
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    res.status(200).json({ success: true, message: 'Job updated successfully', job });
  } catch (error) {
    console.error('Error editing job:', error);
    res.status(500).json({ success: false, message: 'Server error editing job' });
  }
};

// Admin endpoint to delete a job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    // Also remove from saved jobs if necessary
    await SavedJob.deleteMany({ job: req.params.id });
    
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ success: false, message: 'Server error deleting job' });
  }
};
