import { useState, useEffect } from 'react';

const DonateSection = () => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    // Check for success or cancel query parameters
    const query = new URLSearchParams(window.location.search);

    if (query.get('success')) {
      setMessage({
        type: 'success',
        text: 'Thank you for your generous donation! Your support directly helps the mission.',
      });
      // Remove query params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (query.get('canceled')) {
      setMessage({
        type: 'info',
        text: 'Donation canceled. If you had any issues, please let us know.',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDonate = async () => {
    if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid donation amount.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          name
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Stripe API keys. Please check your .env file.');
        }
        throw new Error('Failed to create checkout session');
      }

      const session = await response.json();

      if (session.url) {
        // Redirect to Stripe Checkout
        window.location.href = session.url;
      } else {
        throw new Error('Stripe session URL not found');
      }
    } catch (error: any) {
      console.error('Donation Error:', error);
      const errorMsg = error.message.includes('API keys') 
        ? error.message 
        : 'There was an error connecting to the payment gateway. Please verify your Stripe keys in the .env file.';
      
      setMessage({ type: 'error', text: errorMsg });
      alert(errorMsg); // Fallback alert for high visibility
      setIsLoading(false);
    }
  };

  return (
    <section id="donate">
      <div className="container">
        <h2 className="section-title">Make a Donation</h2>
        
        <p style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 2rem' }}>
          Your generous donation directly impacts lives in El Seibo. Every contribution helps us provide essential 
          medical care, medications, and hope to families in the batey communities.
        </p>

        <div className="impact-stats">
          <div className="stat-item">
            <div className="stat-number">5,000+</div>
            <div className="stat-label">Patients Served Annually</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">15+</div>
            <div className="stat-label">Batey Communities Reached</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">100+</div>
            <div className="stat-label">Volunteers Each Year</div>
          </div>
        </div>

        <h3 style={{ textAlign: 'center', color: '#2c5aa0', margin: '2rem 0 1rem' }}>Sponsorship Tiers</h3>
        
        <div className="donation-options">
          <div className={`donation-card ${amount === '50' ? 'active' : ''}`} onClick={() => setAmount('50')} style={{ border: amount === '50' ? '2px solid #2c5aa0' : '1px solid #ddd' }}>
            <h3>$50</h3>
            <p><strong>Provides medications</strong></p>
            <p>for 5 patients with chronic conditions</p>
          </div>
          <div className={`donation-card ${amount === '100' ? 'active' : ''}`} onClick={() => setAmount('100')} style={{ border: amount === '100' ? '2px solid #2c5aa0' : '1px solid #ddd' }}>
            <h3>$100</h3>
            <p><strong>Supplies a medical clinic</strong></p>
            <p>with essential equipment for one day</p>
          </div>
          <div className={`donation-card ${amount === '250' ? 'active' : ''}`} onClick={() => setAmount('250')} style={{ border: amount === '250' ? '2px solid #2c5aa0' : '1px solid #ddd' }}>
            <h3>$250</h3>
            <p><strong>Sponsors comprehensive care</strong></p>
            <p>for an entire family including dental and vision</p>
          </div>
          <div className={`donation-card ${amount === '500' ? 'active' : ''}`} onClick={() => setAmount('500')} style={{ border: amount === '500' ? '2px solid #2c5aa0' : '1px solid #ddd' }}>
            <h3>$500</h3>
            <p><strong>Funds a mission trip</strong></p>
            <p>for one volunteer healthcare provider</p>
          </div>
        </div>

        <div className="custom-donation">
          <h3 style={{ color: '#2c5aa0', textAlign: 'center', marginBottom: '1.5rem' }}>Donation Details</h3>
          
          {message && (
            <div className={`alert ${message.type}`} style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              {message.type === 'success' ? '🙏 ' : ''}{message.text}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="donation-amount">Amount ($):</label>
            <input 
              type="text" 
              id="donation-amount" 
              placeholder="Enter amount" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="donor-name">Name (Optional):</label>
            <input 
              type="text" 
              id="donor-name" 
              placeholder="Your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <button 
            onClick={handleDonate} 
            style={{ width: '100%', opacity: isLoading ? 0.7 : 1 }}
            disabled={isLoading}
          >
            {isLoading ? 'Connecting to Stripe...' : 'Donate with Stripe'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666', marginTop: '1rem' }}>
            Secure checkout via Stripe • Redirecting to payment portal
          </p>
        </div>

        <div style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '8px', marginTop: '3rem', borderLeft: '4px solid #2c5aa0' }}>
          <h3 style={{ color: '#2c5aa0', marginBottom: '1rem' }}>Other Ways to Support</h3>
          <ul style={{ marginLeft: '1.5rem', lineHeight: '2' }}>
            <li><strong>Medical Supplies:</strong> Donate unused medical equipment and supplies</li>
            <li><strong>In-Kind Donations:</strong> Contribute medications, vitamins, or medical consumables</li>
            <li><strong>Volunteer:</strong> Join us on a mission trip and serve with your skills</li>
            <li><strong>Legacy Giving:</strong> Include El Seibo Mission in your estate planning</li>
          </ul>
        </div>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#666', fontStyle: 'italic' }}>
          "For I was hungry and you gave me food, I was thirsty and you gave me drink, I was a stranger and you welcomed me, 
          I was naked and you clothed me, I was sick and you visited me..." - Matthew 25:35-36
        </p>
      </div>
    </section>
  );
};

export default DonateSection;
