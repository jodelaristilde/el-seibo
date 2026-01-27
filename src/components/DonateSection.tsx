import { useState, useEffect } from 'react';
import EditableText from './EditableText';

const DonateSection = ({ isAdmin }: { isAdmin: boolean }) => {
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
        <EditableText 
          contentKey="donate_title" 
          defaultText="Make a Donation" 
          isAdmin={isAdmin} 
          tagName="h2" 
          className="section-title"
        />
        
        <EditableText 
          contentKey="donate_intro" 
          defaultText="Your generous donation directly impacts lives in El Seibo. Every contribution helps us provide essential medical care, medications, and hope to families in the batey communities." 
          isAdmin={isAdmin} 
          tagName="p" 
          multiline={true}
          style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 2rem' }}
        />

        <div className="impact-stats">
          <div className="stat-item">
            <EditableText contentKey="stat_patients_num" defaultText="5,000+" isAdmin={isAdmin} tagName="div" className="stat-number" />
            <EditableText contentKey="stat_patients_label" defaultText="Patients Served Annually" isAdmin={isAdmin} tagName="div" className="stat-label" />
          </div>
          <div className="stat-item">
            <EditableText contentKey="stat_bateys_num" defaultText="15+" isAdmin={isAdmin} tagName="div" className="stat-number" />
            <EditableText contentKey="stat_bateys_label" defaultText="Batey Communities Reached" isAdmin={isAdmin} tagName="div" className="stat-label" />
          </div>
          <div className="stat-item">
            <EditableText contentKey="stat_volunteers_num" defaultText="100+" isAdmin={isAdmin} tagName="div" className="stat-number" />
            <EditableText contentKey="stat_volunteers_label" defaultText="Volunteers Each Year" isAdmin={isAdmin} tagName="div" className="stat-label" />
          </div>
        </div>

        <h3 style={{ textAlign: 'center', color: '#2c5aa0', margin: '2rem 0 1rem' }}>Sponsorship Tiers</h3>
        
        <div className="donation-options">
          <div className={`donation-card ${amount === '50' ? 'active' : ''}`} onClick={() => setAmount('50')} style={{ border: amount === '50' ? '2px solid #2c5aa0' : '1px solid #ddd' }}>
            <EditableText contentKey="tier1_amount" defaultText="$50" isAdmin={isAdmin} tagName="h3" />
            <EditableText contentKey="tier1_title" defaultText="Provides medications" isAdmin={isAdmin} tagName="p" style={{ fontWeight: 'bold' }} />
            <EditableText contentKey="tier1_text" defaultText="for 5 patients with chronic conditions" isAdmin={isAdmin} tagName="p" />
          </div>
          <div className={`donation-card ${amount === '100' ? 'active' : ''}`} onClick={() => setAmount('100')} style={{ border: amount === '100' ? '2px solid #2c5aa0' : '1px solid #ddd' }}>
            <EditableText contentKey="tier2_amount" defaultText="$100" isAdmin={isAdmin} tagName="h3" />
            <EditableText contentKey="tier2_title" defaultText="Supplies a medical clinic" isAdmin={isAdmin} tagName="p" style={{ fontWeight: 'bold' }} />
            <EditableText contentKey="tier2_text" defaultText="with essential equipment for one day" isAdmin={isAdmin} tagName="p" />
          </div>
          <div className={`donation-card ${amount === '250' ? 'active' : ''}`} onClick={() => setAmount('250')} style={{ border: amount === '250' ? '2px solid #2c5aa0' : '1px solid #ddd' }}>
            <EditableText contentKey="tier3_amount" defaultText="$250" isAdmin={isAdmin} tagName="h3" />
            <EditableText contentKey="tier3_title" defaultText="Sponsors comprehensive care" isAdmin={isAdmin} tagName="p" style={{ fontWeight: 'bold' }} />
            <EditableText contentKey="tier3_text" defaultText="for an entire family including dental and vision" isAdmin={isAdmin} tagName="p" />
          </div>
          <div className={`donation-card ${amount === '500' ? 'active' : ''}`} onClick={() => setAmount('500')} style={{ border: amount === '500' ? '2px solid #2c5aa0' : '1px solid #ddd' }}>
            <EditableText contentKey="tier4_amount" defaultText="$500" isAdmin={isAdmin} tagName="h3" />
            <EditableText contentKey="tier4_title" defaultText="Funds a mission trip" isAdmin={isAdmin} tagName="p" style={{ fontWeight: 'bold' }} />
            <EditableText contentKey="tier4_text" defaultText="for one volunteer healthcare provider" isAdmin={isAdmin} tagName="p" />
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
          <EditableText 
            contentKey="other_support_title" 
            defaultText="Other Ways to Support" 
            isAdmin={isAdmin} 
            tagName="h3" 
            style={{ color: '#2c5aa0', marginBottom: '1rem' }}
          />
          <ul style={{ marginLeft: '1.5rem', lineHeight: '2' }}>
            <li><EditableText contentKey="support_way1" defaultText="Medical Supplies: Donate unused medical equipment and supplies" isAdmin={isAdmin} tagName="span" /></li>
            <li><EditableText contentKey="support_way2" defaultText="In-Kind Donations: Contribute medications, vitamins, or medical consumables" isAdmin={isAdmin} tagName="span" /></li>
            <li><EditableText contentKey="support_way3" defaultText="Volunteer: Join us on a mission trip and serve with your skills" isAdmin={isAdmin} tagName="span" /></li>
            <li><EditableText contentKey="support_way4" defaultText="Legacy Giving: Include El Seibo Mission in your estate planning" isAdmin={isAdmin} tagName="span" /></li>
          </ul>
        </div>

        <EditableText 
          contentKey="donate_footer_verse" 
          defaultText='"For I was hungry and you gave me food, I was thirsty and you gave me drink, I was a stranger and you welcomed me, I was naked and you clothed me, I was sick and you visited me..." - Matthew 25:35-36' 
          isAdmin={isAdmin} 
          tagName="p" 
          multiline={true}
          style={{ textAlign: 'center', marginTop: '2rem', color: '#666', fontStyle: 'italic' }}
        />
      </div>
    </section>
  );
};

export default DonateSection;
