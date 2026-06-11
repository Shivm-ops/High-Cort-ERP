export default function Pricing() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold mb-4 text-slate-900">Simple, Transparent Pricing</h1>
        <p className="text-xl text-slate-600">Choose the right plan for your legal practice.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Basic Plan */}
        <div className="border rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
          <h3 className="text-2xl font-bold mb-4">Solo Advocate</h3>
          <p className="text-4xl font-bold mb-6">₹1,999<span className="text-lg text-gray-500 font-normal">/mo</span></p>
          <ul className="space-y-3 mb-8 text-gray-600">
            <li>✓ Up to 100 Active Cases</li>
            <li>✓ Unlimited Clients</li>
            <li>✓ Basic Notice & Drafts</li>
            <li>✓ Standard Support</li>
          </ul>
          <button className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800">Get Started</button>
        </div>

        {/* Pro Plan */}
        <div className="border rounded-2xl p-8 shadow-xl border-blue-500 relative transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">Most Popular</div>
          <h3 className="text-2xl font-bold mb-4">Law Firm Pro</h3>
          <p className="text-4xl font-bold mb-6">₹4,999<span className="text-lg text-gray-500 font-normal">/mo</span></p>
          <ul className="space-y-3 mb-8 text-gray-600">
            <li>✓ Unlimited Cases</li>
            <li>✓ Up to 10 Team Members</li>
            <li>✓ Advanced AI Drafting</li>
            <li>✓ Priority Support</li>
            <li>✓ Custom Letterheads</li>
          </ul>
          <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Get Started</button>
        </div>

        {/* Enterprise Plan */}
        <div className="border rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
          <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
          <p className="text-4xl font-bold mb-6">Custom</p>
          <ul className="space-y-3 mb-8 text-gray-600">
            <li>✓ Unlimited Everything</li>
            <li>✓ Dedicated Account Manager</li>
            <li>✓ On-Premise Deployment Option</li>
            <li>✓ API Access</li>
          </ul>
          <button className="w-full py-3 border-2 border-slate-900 text-slate-900 rounded-lg font-semibold hover:bg-slate-50">Contact Sales</button>
        </div>
      </div>
    </div>
  );
}
