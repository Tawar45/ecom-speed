// utils/emailTemplates.ts

export function welcomeEmailTemplate({shopName , planName}: {
    shopName: string;
    planName:string;
  }) {
return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to Ecom Speed Expert</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style type="text/css">
    /* Basic styles for email clients that support CSS */
    @media screen and (max-width: 600px) {
      .benefit-list, .plan-features {
        display: block !important;
        width: 100% !important;
      }
      
      .steps {
        display: block !important;
      }
      
      .step:not(:last-child)::after {
        display: none !important;
      }
      
      .logo-x {
        font-size: 20px !important;
        margin: 0 10px !important;
      }
      
      .logo, .shopify-logo {
        height: 40px !important;
      }
      
      .benefit-item {
        display: block !important;
        width: 100% !important;
        margin-bottom: 15px !important;
      }
      
      .plan-feature {
        display: block !important;
        width: 100% !important;
        margin-bottom: 10px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Open Sans', sans-serif; background-color: #f5f5f5; color: #000; line-height: 1.6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="700" border="0" cellspacing="0" cellpadding="0" style="max-width: 700px; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #97ba52; color: white; padding: 40px 30px; text-align: center; position: relative;">
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px; position: relative; z-index: 1;">
                <img src="https://cdn.shopify.com/s/files/1/0588/5476/8717/files/Ecom_Speed_Expert_1.png?v=1761657122" alt="Ecom Speed Expert Logo" width="70" style="height: 70px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <span style="font-size: 28px; margin: 0 15px; font-weight: 700; font-family: 'Poppins', sans-serif;">×</span>
                <img src="https://cdn.shopify.com/s/files/1/0588/5476/8717/files/Shopify_logo_1.png?v=1761659987" alt="Shopify Logo" width="50" style="height: 50px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              </div>
              <div style="background-color: rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 15px; font-size: 14px; font-weight: 600; margin-top: 10px; display: inline-block;">App Developed By Official Shopify Partners</div>
              <h1 style="font-family: 'Poppins', sans-serif; font-size: 32px; font-weight: 700; margin-bottom: 10px; position: relative; z-index: 1; margin-top: 15px;">Welcome to Ecom Speed Expert!</h1>
              <p style="font-size: 18px; opacity: 0.9; position: relative; z-index: 1;">Your journey to a faster, more profitable store starts now</p>
            </td>
          </tr>
          
          <!-- Welcome Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px 30px; text-align: center; border-bottom: 1px solid #e9ecef;">
              <h2 style="font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 600; color: #97ba52; margin-bottom: 10px;">🎉 Thank You for Installing Our App!</h2>
              <p style="font-size: 16px; color: #666;">Your store is now being optimized for speed automatically. No setup required!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <!-- Benefits Section -->
              <div style="margin-bottom: 35px;">
                <h2 style="font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; color: #97ba52; margin-bottom: 20px; display: flex; align-items: center;">
                  <i class="fas fa-rocket" style="margin-right: 10px;"></i> What Our App Does for Your Store
                </h2>
                
                <!-- Fixed Benefits Table -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="benefit-list">
                  <tr>
                    <td width="50%" style="padding-right: 10px;" valign="top">
                      <div style="display: flex; align-items: flex-start; padding: 20px; background: #f5f5f5; border-radius: 10px; height: 100%;">
                        <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                        <div>
                          <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Faster Page Navigation</h4>
                          <p style="font-size: 14px; color: #666; margin: 0;">Preloads pages before users click, reducing wait time by 200-300ms</p>
                        </div>
                      </div>
                    </td>
                    <td width="50%" style="padding-left: 10px;" valign="top">
                      <div style="display: flex; align-items: flex-start; padding: 20px; background: #f5f5f5; border-radius: 10px; height: 100%;">
                        <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                        <div>
                          <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Font Optimization</h4>
                          <p style="font-size: 14px; color: #666; margin: 0;">Prevents text flashes and improves perceived performance</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="height: 20px;"></td>
                  </tr>
                  <tr>
                    <td width="50%" style="padding-right: 10px;" valign="top">
                      <div style="display: flex; align-items: flex-start; padding: 20px; background: #f5f5f5; border-radius: 10px; height: 100%;">
                        <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                        <div>
                          <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Image Lazy Loading</h4>
                          <p style="font-size: 14px; color: #666; margin: 0;">Delays loading images until needed, reducing initial page load time</p>
                        </div>
                      </div>
                    </td>
                    <td width="50%" style="padding-left: 10px;" valign="top">
                      <div style="display: flex; align-items: flex-start; padding: 20px; background: #f5f5f5; border-radius: 10px; height: 100%;">
                        <span style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 16px; margin-right: 15px; flex-shrink: 0;">✓</span>
                        <div>
                          <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">JavaScript Optimization</h4>
                          <p style="font-size: 14px; color: #666; margin: 0;">Prevents blocking page rendering with smart script loading</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- How It Works Section -->
              <div style="margin-bottom: 35px;">
                <h2 style="font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; color: #97ba52; margin-bottom: 20px; display: flex; align-items: center;">
                  <i class="fas fa-cogs" style="margin-right: 10px;"></i> How It Works
                </h2>
                
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px;">
                  <p style="margin-bottom: 20px;">Our app works silently in the background to optimize your store's performance. Here's how:</p>
                  
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="steps">
                    <tr>
                      <td width="33%" style="text-align: center; padding: 10px; position: relative;" valign="top">
                        <div style="display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 24px; font-weight: 600; margin: 0 auto 15px;">1</div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Install</h4>
                        <p style="font-size: 14px; color: #666; padding: 0 10px;">One-click installation with no setup required</p>
                      </td>
                      <td width="33%" style="text-align: center; padding: 10px; position: relative;" valign="top">
                        <div style="display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 24px; font-weight: 600; margin: 0 auto 15px;">2</div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Analyze & Optimize</h4>
                        <p style="font-size: 14px; color: #666; padding: 0 10px;">App identifies opportunities and applies improvements automatically</p>
                      </td>
                      <td width="33%" style="text-align: center; padding: 10px; position: relative;" valign="top">
                        <div style="display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 24px; font-weight: 600; margin: 0 auto 15px;">3</div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Report</h4>
                        <p style="font-size: 14px; color: #666; padding: 0 10px;">Receive weekly updates on performance improvements</p>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <!-- Next Steps Section -->
              <div style="margin-bottom: 35px;">
                <h2 style="font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; color: #97ba52; margin-bottom: 20px; display: flex; align-items: center;">
                  <i class="fas fa-list-ol" style="margin-right: 10px;"></i> Your Next Steps
                </h2>
                
                <div style="background-color: #f5f5f5; border-radius: 12px; padding: 25px;">
                  <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; align-items: flex-start;">
                      <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 14px; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">✓</span>
                      <div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Explore Your Dashboard</h4>
                        <p style="font-size: 14px; color: #666; margin: 0;">Check your app dashboard to see real-time performance metrics</p>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start;">
                      <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 14px; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">✓</span>
                      <div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Wait for Your First Report</h4>
                        <p style="font-size: 14px; color: #666; margin: 0;">You'll receive your first performance report in 7 days</p>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start;">
                      <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 14px; margin-right: 12px; margin-top: 2px; flex-shrink: 0;">✓</span>
                      <div>
                        <h4 style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #000;">Consider Upgrading</h4>
                        <p style="font-size: 14px; color: #666; margin: 0;">Unlock optimization for all pages with our premium plan</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Plan Info Section -->
              <div style="margin-bottom: 35px;">
                <h2 style="font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; color: #97ba52; margin-bottom: 20px; display: flex; align-items: center;">
                  <i class="fas fa-credit-card" style="margin-right: 10px;"></i> Your Current Plan
                </h2>
                
                <div style="background-color: #f5f5f5; border-radius: 12px; padding: 25px; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: 0; right: 0; width: 150px; height: 150px; background: radial-gradient(circle, rgba(151, 186, 82, 0.1) 0%, rgba(151, 186, 82, 0) 70%); border-radius: 50%; transform: translate(30%, -30%);"></div>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 600; color: #000;">You're on the Free Plan</div>
                    <div style="background-color: #ffc107; color: #856404; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">Limited</div>
                  </div>
                  
                  <!-- Fixed Plan Features Table -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="plan-features">
                    <tr>
                      <td width="50%" style="padding-right: 10px; padding-bottom: 10px;" valign="top">
                        <div style="display: flex; align-items: center;">
                          <span style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #97ba52; color: white; border-radius: 50%; font-size: 12px; margin-right: 10px;">✓</span>
                          <p style="font-size: 14px; margin: 0;">Home page optimization</p>
                        </div>
                      </td>
                      <td width="50%" style="padding-left: 10px; padding-bottom: 10px;" valign="top">
                        <div style="display: flex; align-items: center;">
                          <span style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #e9ecef; color: #999; border-radius: 50%; font-size: 12px; margin-right: 10px;">✓</span>
                          <p style="font-size: 14px; margin: 0; color: #999;">Product page optimization</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding-right: 10px; padding-bottom: 10px;" valign="top">
                        <div style="display: flex; align-items: center;">
                          <span style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #e9ecef; color: #999; border-radius: 50%; font-size: 12px; margin-right: 10px;">✓</span>
                          <p style="font-size: 14px; margin: 0; color: #999;">Collection page optimization</p>
                        </div>
                      </td>
                      <td width="50%" style="padding-left: 10px; padding-bottom: 10px;" valign="top">
                        <div style="display: flex; align-items: center;">
                          <span style="display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background-color: #e9ecef; color: #999; border-radius: 50%; font-size: 12px; margin-right: 10px;">✓</span>
                          <p style="font-size: 14px; margin: 0; color: #999;">Cart page optimization</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <a href="[Upgrade URL]" style="display: inline-block; padding: 14px 24px; background-color: #97ba52; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.3s ease, box-shadow 0.3s ease; text-align: center; cursor: pointer; border: none; font-family: 'Poppins', sans-serif;">Upgrade to Premium</a>
                </div>
              </div>
              
              <!-- Motivation Box -->
              <div style="background: linear-gradient(135deg, #97ba52 0%, #7a9442 100%); color: white; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h3 style="font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 600; margin-bottom: 15px;">🚀 Why Speed Optimization Matters for Your Store</h3>
                <p style="font-size: 15px; margin-bottom: 15px; opacity: 0.95;">Every millisecond counts in e-commerce. Amazon found that every 100ms of latency reduces sales by 1%.</p>
                
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: transparent; color: white; border-radius: 50%; font-size: 16px; margin-right: 10px;">✓</span>
                  <p style="font-size: 15px; margin: 0; font-weight: 500;">Improved user experience leads to higher conversion rates</p>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: transparent; color: white; border-radius: 50%; font-size: 16px; margin-right: 10px;">✓</span>
                  <p style="font-size: 15px; margin: 0; font-weight: 500;">Faster sites rank better in search results</p>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background-color: transparent; color: white; border-radius: 50%; font-size: 16px; margin-right: 10px;">✓</span>
                  <p style="font-size: 15px; margin: 0; font-weight: 500;">Reduced bounce rates keep customers on your site longer</p>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Separator -->
          <tr>
            <td style="height: 1px; background: linear-gradient(90deg, transparent, #e9ecef, transparent); margin: 30px 0;"></td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <h3 style="font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #000;">Need Help?</h3>
              <p style="margin-bottom: 20px; color: #666;">Our support team is here to help you get the most out of our app. Feel free to reach out with any questions.</p>
              <a href="[Support URL]" style="display: inline-block; padding: 14px 24px; background-color: #000; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: transform 0.3s ease, box-shadow 0.3s ease; text-align: center; cursor: pointer; border: none; font-family: 'Poppins', sans-serif;">Contact Support</a>
              <div style="margin-top: 20px; font-size: 14px; color: #666;">
                <p>Ecom Speed Expert © 2023</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
  