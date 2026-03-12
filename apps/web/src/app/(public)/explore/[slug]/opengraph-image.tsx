import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Givar Project Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
    const { slug } = params;

    // Parallel fetch: Project Details + Live FX Rates
    // Note: Using standard fetch for Edge Runtime compatibility
    const [project, fxData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${slug}`).then(res => res.json()),
        fetch('https://open.er-api.com/v6/latest/NGN').then(res => res.json()).catch(() => null)
    ]);

    if (!project) {
        return new Response('Project not found', { status: 404 });
    }

    const raised = Number(project.raisedAmount || 0) / 100;
    const target = Number(project.targetAmount || 0) / 100;
    const percent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

    // Calculate USD approx for the card using er-api NGN base
    const usdRate = fxData?.rates?.USD || 0.00065;
    const usdGoal = Math.round(target * usdRate);

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    padding: '40px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        height: '100%',
                        borderRadius: '40px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#fafafa',
                    }}
                >
                    {/* Left Column: Cover Image */}
                    <div style={{ display: 'flex', width: '50%', height: '100%', position: 'relative' }}>
                        <img
                            src={project.imageUrl || 'https://givarapp.com/Givar1.png'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {/* Right Column: Information & Progress */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '50%',
                            padding: '60px 40px',
                            justifyContent: 'space-between',
                            backgroundColor: '#ffffff',
                        }}
                    >
                        {/* Top Section: Branding & Title */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                <img
                                    src="https://givarapp.com/Givar1.png"
                                    width="48"
                                    height="48"
                                    style={{ borderRadius: '12px' }}
                                />
                                <span style={{ marginLeft: '16px', fontSize: '28px', fontWeight: 'bold', color: '#10b981', letterSpacing: '-0.02em' }}>
                                    Givar<span style={{ color: '#064e3b' }}>.</span>
                                </span>
                            </div>
                            <h1 style={{ fontSize: '44px', fontWeight: 900, color: '#064e3b', lineHeight: 1.1, margin: 0 }}>
                                {project.title}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                                <span style={{ fontSize: '20px', color: '#6b7280', fontWeight: 600 }}>{project.location || 'Verified Cause'}</span>
                            </div>
                        </div>

                        {/* Bottom Section: Progress Bar & Monetary Goals */}
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{percent}% Funded</div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{ display: 'flex', fontSize: '22px', fontWeight: 'bold', color: '#064e3b' }}>Goal: ₦{(target).toLocaleString()}</div>
                                    <div style={{ display: 'flex', fontSize: '16px', fontWeight: 'bold', color: '#9ca3af', marginTop: '4px' }}>≈ ${usdGoal.toLocaleString()} USD</div>
                                </div>
                            </div>

                            {/* Progress Bar Container */}
                            <div style={{
                                display: 'flex',
                                width: '100%',
                                height: '16px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '8px',
                                overflow: 'hidden'
                            }}>
                                {/* Active Progress Fill */}
                                <div style={{
                                    display: 'flex',
                                    width: `${percent}%`,
                                    height: '100%',
                                    backgroundColor: '#10b981',
                                    borderRadius: '8px'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}