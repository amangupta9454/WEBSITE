const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const AppliedJob = require('../models/AppliedJob');
const axios = require('axios');
const User = require('../models/User');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');

const getJobPortalConfig = async () => {
  try {
    const freeSetting = await Settings.findOne({ key: "jobPortalFreeMode" });
    const priceSetting = await Settings.findOne({ key: "jobPortalPremiumPrice" });
    const expiresSetting = await Settings.findOne({ key: "jobPortalFreeModeExpires" });

    let isFreeMode = freeSetting ? freeSetting.value === true : true;
    let freeModeExpires = expiresSetting ? expiresSetting.value : null;
    const premiumPrice = priceSetting ? Number(priceSetting.value) || 199 : 199;

    // Check automatic 30-day expiration
    if (isFreeMode && freeModeExpires && new Date(freeModeExpires) < new Date()) {
      isFreeMode = false;
      if (freeSetting) {
        freeSetting.value = false;
        await freeSetting.save();
      } else {
        await Settings.create({ key: "jobPortalFreeMode", value: false });
      }
      await Settings.deleteOne({ key: "jobPortalFreeModeExpires" });
      freeModeExpires = null;
    }

    return { isFreeMode, freeModeExpires, premiumPrice };
  } catch (err) {
    return { isFreeMode: true, freeModeExpires: null, premiumPrice: 199 };
  }
};

const checkUserPremiumAccess = async (req) => {
  try {
    const { isFreeMode, freeModeExpires, premiumPrice } = await getJobPortalConfig();
    if (isFreeMode) {
      return { isPremium: true, user: null, isFreeMode, freeModeExpires, premiumPrice };
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return { isPremium: false, user: null, isFreeMode, freeModeExpires, premiumPrice };
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'secret');
    const userId = decoded.unifiedUserId || decoded.id || decoded.userId;
    const user = await User.findById(userId);
    if (!user) return { isPremium: false, user: null, isFreeMode, freeModeExpires, premiumPrice };
    if (user.jobPortalPremium && user.jobPortalPremiumExpires && new Date(user.jobPortalPremiumExpires) > new Date()) {
      return { isPremium: true, user, isFreeMode, freeModeExpires, premiumPrice };
    }
    return { isPremium: false, user, isFreeMode, freeModeExpires, premiumPrice };
  } catch (err) {
    return { isPremium: false, user: null, isFreeMode: true, freeModeExpires: null, premiumPrice: 199 };
  }
};

// Get all jobs with filtering and pagination
exports.getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 12, role, location, remote, minSalary, admin, planType } = req.query;
    
    // Build query
    const query = {};
    if (admin !== 'true') {
      query.isActive = true;
    }
    
    if (planType) {
      query.planType = planType;
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
    
    const jobs = await Job.find(query)
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    const total = await Job.countDocuments(query);
    
    const { isPremium } = await checkUserPremiumAccess(req);
    const processedJobs = jobs.map(job => {
      const jobObj = job.toObject ? job.toObject() : { ...job };
      if (admin !== 'true' && jobObj.planType === 'Premium' && !isPremium) {
        jobObj.applyUrl = null;
        jobObj.applyEmail = null;
        jobObj.isLocked = true;
      } else {
        jobObj.isLocked = false;
      }
      return jobObj;
    });
    
    res.status(200).json({
      success: true,
      data: processedJobs,
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
    
    const { isPremium, isFreeMode, premiumPrice } = await checkUserPremiumAccess(req);
    const jobObj = job.toObject ? job.toObject() : { ...job };
    if (req.query.admin !== 'true' && jobObj.planType === 'Premium' && !isPremium) {
      jobObj.applyUrl = null;
      jobObj.applyEmail = null;
      jobObj.isLocked = true;
    } else {
      jobObj.isLocked = false;
    }

    res.status(200).json({ success: true, data: jobObj, isFreeMode, premiumPrice: premiumPrice || 199 });
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
    const { title, company, location, isRemote, salary, applyUrl, applyEmail, description, planType } = req.body;
    
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { title, company, location, isRemote, salary, applyUrl, applyEmail, description, planType },
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

// Admin endpoint to manually create a job opportunity
exports.createJob = async (req, res) => {
  try {
    const { title, company, location, salary, isRemote, category, description, applyUrl, applyEmail, planType } = req.body;
    
    if (!title || !company || !location || (!applyUrl && !applyEmail)) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields (Title, Company, Location, Apply Link or Email)' });
    }

    const externalId = 'manual_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const newJob = await Job.create({
      externalId,
      title,
      company,
      location,
      salary: salary || 'Not disclosed',
      isRemote: Boolean(isRemote || (location && location.toLowerCase().includes('remote'))),
      category: category || 'General',
      description: description || '',
      applyUrl: applyUrl || (applyEmail ? `mailto:${applyEmail}` : '#'),
      applyEmail: applyEmail || '',
      planType: planType || 'Basic',
      source: 'Admin Portal',
      isActive: true,
      postedAt: new Date(),
      fetchedAt: new Date()
    });

    res.status(201).json({ success: true, message: 'Job opportunity created successfully!', data: newJob });
  } catch (error) {
    console.error('Error creating job manually:', error);
    res.status(500).json({ success: false, message: 'Server error creating job opportunity' });
  }
};

// Get user's Job Portal membership status and token balance
exports.getUserStatus = async (req, res) => {
  try {
    const userId = req.user.unifiedUserId || req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { isFreeMode, freeModeExpires, premiumPrice } = await getJobPortalConfig();

    let isPremium = false;
    if (isFreeMode) {
      isPremium = true;
    } else if (user.jobPortalPremium && user.jobPortalPremiumExpires && new Date(user.jobPortalPremiumExpires) > new Date()) {
      isPremium = true;
    } else if (user.jobPortalPremium && new Date(user.jobPortalPremiumExpires) <= new Date()) {
      user.jobPortalPremium = false;
      await user.save();
    }

    res.status(200).json({
      success: true,
      isPremium,
      isFreeMode,
      freeModeExpires,
      premiumPrice,
      expiresAt: isFreeMode ? (freeModeExpires ? new Date(freeModeExpires).toLocaleDateString() : 'Active Promo') : (user.jobPortalPremiumExpires || null),
      tokens: user.interviewCredits || 0
    });
  } catch (error) {
    console.error('Error fetching user status for job portal:', error);
    res.status(500).json({ success: false, message: 'Server error fetching membership status' });
  }
};

// Purchase Job Portal Premium Plan (configurable Tokens for 3 Months)
exports.purchasePremium = async (req, res) => {
  try {
    const { isFreeMode, premiumPrice } = await getJobPortalConfig();
    if (isFreeMode) {
      return res.status(400).json({ 
        success: false, 
        message: "🎉 Free Promo Mode is currently active for all students! You do not need to spend any tokens." 
      });
    }

    const userId = req.user.unifiedUserId || req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentTokens = user.interviewCredits || 0;
    if (currentTokens < premiumPrice) {
      return res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_TOKENS',
        message: `You need ${premiumPrice} tokens to purchase Premium. Your balance is ${currentTokens} tokens.`
      });
    }

    user.interviewCredits = currentTokens - premiumPrice;
    user.tokenHistory = user.tokenHistory || [];
    user.tokenHistory.push({
      type: 'USE',
      amount: premiumPrice,
      reason: `Purchased Job Portal Premium (90 Days at ${premiumPrice} Tokens)`,
      date: new Date()
    });

    const baseDate = (user.jobPortalPremium && user.jobPortalPremiumExpires && new Date(user.jobPortalPremiumExpires) > new Date())
      ? new Date(user.jobPortalPremiumExpires)
      : new Date();
    user.jobPortalPremium = true;
    user.jobPortalPremiumExpires = new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000);

    await user.save();

    res.status(200).json({
      success: true,
      message: `🎉 Job Portal Premium Unlocked successfully for 3 months using ${premiumPrice} tokens!`,
      isPremium: true,
      isFreeMode: false,
      premiumPrice,
      expiresAt: user.jobPortalPremiumExpires,
      tokens: user.interviewCredits
    });
  } catch (error) {
    console.error('Error purchasing job portal premium:', error);
    res.status(500).json({ success: false, message: 'Server error purchasing premium plan' });
  }
};

// Bulk import jobs from uploaded Excel or CSV spreadsheet
exports.importJobsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const xlsx = require("xlsx");
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;
    const jobsToInsert = [];

    for (const rawRow of rawData) {
      const row = {};
      for (const key in rawRow) {
        const cleanKey = key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        row[cleanKey] = rawRow[key];
      }

      const title = (row.title || row.jobtitle || row.role || "").toString().trim();
      const company = (row.company || row.companyname || row.organisation || row.employer || "").toString().trim();
      
      if (!title || !company) continue;

      const location = (row.location || row.city || row.worklocation || "Remote").toString().trim();
      const salary = (row.salary || row.stipend || row.package || row.ctc || row.compensation || "Competitive").toString().trim();
      
      const planRaw = (row.plantype || row.plan || row.tier || row.type || "Basic").toString().trim().toLowerCase();
      const planType = (planRaw.startsWith('p') || planRaw.includes('prem')) ? 'Premium' : 'Basic';

      const applyUrl = (row.applyurl || row.applylink || row.url || row.link || "").toString().trim();
      const applyEmail = (row.applyemail || row.recruiteremail || row.email || row.contactemail || row.mail || "").toString().trim();

      const description = (row.description || row.jobdescription || row.jd || row.requirements || row.details || "Details shared on application portal.").toString().trim();
      
      const remoteRaw = (row.isremote || row.remote || row.wfh || "").toString().trim().toLowerCase();
      const isRemote = (remoteRaw === 'true' || remoteRaw === 'yes' || remoteRaw === '1' || location.toLowerCase().includes('remote'));

      jobsToInsert.push({
        title,
        company,
        location,
        salary,
        applyUrl,
        applyEmail,
        description,
        isRemote,
        planType,
        source: 'Excel Import',
        jobType: 'Full-Time',
        isActive: true,
        postedAt: new Date(),
        fetchedAt: new Date()
      });
    }

    if (jobsToInsert.length > 0) {
      await Job.insertMany(jobsToInsert);
      importedCount = jobsToInsert.length;
    }

    res.status(200).json({
      success: true,
      count: importedCount,
      message: `🎉 Successfully bulk imported ${importedCount} opportunities from spreadsheet!`
    });
  } catch (error) {
    console.error('Error importing jobs from Excel:', error);
    res.status(500).json({ success: false, message: 'Server error parsing and importing spreadsheet' });
  }
};

// Toggle applied status for a job (Mark as Applied / Unmark)
exports.toggleAppliedJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const userId = req.user.unifiedUserId || req.user.id || req.user._id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const existing = await AppliedJob.findOne({ user: userId, job: jobId });
    if (existing) {
      await AppliedJob.findOneAndDelete({ user: userId, job: jobId });
      return res.status(200).json({ success: true, isApplied: false, message: 'Removed from applied list' });
    } else {
      await AppliedJob.create({ user: userId, job: jobId, status: 'Applied' });
      return res.status(200).json({ success: true, isApplied: true, message: '✅ Recorded as Applied!' });
    }
  } catch (error) {
    console.error('Error toggling applied job:', error);
    res.status(500).json({ success: false, message: 'Server error recording application status' });
  }
};

// Get all applied jobs for a user
exports.getAppliedJobs = async (req, res) => {
  try {
    const userId = req.user.unifiedUserId || req.user.id || req.user._id;
    const applied = await AppliedJob.find({ user: userId }).populate('job').sort({ appliedAt: -1 });
    const validApplied = applied.filter(item => item.job != null).map(item => ({
      _id: item._id,
      appliedAt: item.appliedAt,
      job: item.job,
      status: item.status
    }));

    res.status(200).json({ success: true, data: validApplied });
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applied jobs' });
  }
};

// Admin endpoint to view student interactions (Applied & Saved jobs)
exports.getAdminInteractions = async (req, res) => {
  try {
    const { type = 'applied' } = req.query;
    let records = [];

    if (type === 'saved') {
      const saved = await SavedJob.find()
        .populate('user', 'name email mobile phone phoneNo unifiedUserId')
        .populate('job', 'title company location planType salary isRemote')
        .sort({ savedAt: -1, createdAt: -1 })
        .limit(300);
      records = saved.filter(r => r.user && r.job).map(r => ({
        _id: r._id,
        user: r.user,
        job: r.job,
        action: 'Saved Bookmark',
        date: r.savedAt || r.createdAt
      }));
    } else {
      const applied = await AppliedJob.find()
        .populate('user', 'name email mobile phone phoneNo unifiedUserId')
        .populate('job', 'title company location planType salary isRemote')
        .sort({ appliedAt: -1, createdAt: -1 })
        .limit(300);
      records = applied.filter(r => r.user && r.job).map(r => ({
        _id: r._id,
        user: r.user,
        job: r.job,
        action: 'Marked Applied',
        date: r.appliedAt || r.createdAt
      }));
    }

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching admin interactions:', error);
    res.status(500).json({ success: false, message: 'Server error loading student interaction records' });
  }
};
